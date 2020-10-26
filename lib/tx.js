"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const script_number_1 = require("bitcoinjs-lib/src/script_number");
const bignumber_js_1 = require("bignumber.js");
const buffer_1 = require("buffer");
const opcodes_1 = require("./opcodes");
const coinSelect = require("coinselect");
function ensureAmountInteger(n) {
    if (!Number.isInteger(n)) {
        throw new Error(`Expect tx amount to be an integer, got: ${n}`);
    }
}
function estimatePubKeyHashTransactionMaxSend(utxos, to, feeRate) {
    let maxAmount = 0;
    for (const utxo of utxos) {
        maxAmount += utxo.value;
    }
    while (maxAmount > 0) {
        const { inputs, fee: txfee } = coinSelect(utxos, [{ value: maxAmount, address: to }], feeRate);
        if (inputs != null) {
            return maxAmount;
        }
        // step down by 0.001 bcs
        maxAmount = maxAmount - 100000;
    }
    return 0;
}
exports.estimatePubKeyHashTransactionMaxSend = estimatePubKeyHashTransactionMaxSend;
/**
 * Build a pay-to-pubkey-hash transaction
 *
 * @param keyPair
 * @param to
 * @param amount (unit: satoshi)
 * @param feeRate
 * @param utxoList
 */
function buildPubKeyHashTransaction(utxos, keyPair, to, amount, feeRate) {
    ensureAmountInteger(amount);
    const senderAddress = keyPair.getAddress();
    const { inputs, fee: txfee } = coinSelect(utxos, [{ value: amount, address: to }], feeRate);
    if (inputs == null) {
        throw new Error("could not find UTXOs to build transaction");
    }
    const txb = new bitcoinjs_lib_1.TransactionBuilder(keyPair.getNetwork());
    let vinSum = new bignumber_js_1.BigNumber(0);
    for (const input of inputs) {
        txb.addInput(input.hash, input.pos);
        vinSum = vinSum.plus(input.value);
    }
    txb.addOutput(to, amount);
    const change = vinSum
        .minus(txfee)
        .minus(amount)
        .toNumber();
    if (change > 0) {
        txb.addOutput(senderAddress, change);
    }
    for (let i = 0; i < inputs.length; i++) {
        txb.sign(i, keyPair);
    }
    return txb.build().toHex();
}
exports.buildPubKeyHashTransaction = buildPubKeyHashTransaction;
/**
 * Build a create-contract transaction
 *
 * @param keyPair
 * @param code The contract byte code
 * @param feeRate Fee per byte of tx. (unit: satoshi)
 * @param utxoList
 * @returns the built tx
 */
function buildCreateContractTransaction(utxos, keyPair, code, feeRate, opts = {}) {
    const gasLimit = opts.gasLimit || defaultContractSendTxOptions.gasLimit;
    const gasPrice = opts.gasPrice || defaultContractSendTxOptions.gasPrice;
    const gasLimitFee = new bignumber_js_1.BigNumber(gasLimit).times(gasPrice).toNumber();
    const createContractScript = bitcoinjs_lib_1.script.compile([
        opcodes_1.OPS.OP_4,
        script_number_1.encode(gasLimit),
        script_number_1.encode(gasPrice),
        buffer_1.Buffer.from(code, "hex"),
        opcodes_1.OPS.OP_CREATE,
    ]);
    const fromAddress = keyPair.getAddress();
    const amount = 0;
    const { inputs, fee: txfee } = coinSelect(utxos, [
        // gas fee
        { value: gasLimitFee },
        // script + transfer amount to contract
        { script: createContractScript, value: amount },
    ], feeRate);
    if (inputs == null) {
        throw new Error("could not find UTXOs to build transaction");
    }
    const txb = new bitcoinjs_lib_1.TransactionBuilder(keyPair.getNetwork());
    let totalValue = new bignumber_js_1.BigNumber(0);
    for (const input of inputs) {
        txb.addInput(input.hash, input.pos);
        totalValue = totalValue.plus(input.value);
    }
    // create-contract output
    txb.addOutput(createContractScript, 0);
    const change = totalValue
        .minus(txfee)
        .minus(gasLimitFee)
        .toNumber();
    if (change > 0) {
        txb.addOutput(fromAddress, change);
    }
    for (let i = 0; i < inputs.length; i++) {
        txb.sign(i, keyPair);
    }
    return txb.build().toHex();
}
exports.buildCreateContractTransaction = buildCreateContractTransaction;
const defaultContractSendTxOptions = {
    gasLimit: 250000,
    gasPrice: 40,
    amount: 0,
};
function estimateSendToContractTransactionMaxValue(utxos, keyPair, contractAddress, encodedData, feeRate, opts = {}) {
    feeRate = Math.floor(feeRate);
    const gasLimit = opts.gasLimit || defaultContractSendTxOptions.gasLimit;
    const gasPrice = opts.gasPrice || defaultContractSendTxOptions.gasPrice;
    let amount = 0;
    for (const utxo of utxos) {
        amount += utxo.value;
    }
    amount -= gasLimit * gasPrice;
    ensureAmountInteger(amount);
    const senderAddress = keyPair.getAddress();
    // excess gas will refund in the coinstake tx of the mined block
    const gasLimitFee = new bignumber_js_1.BigNumber(gasLimit).times(gasPrice).toNumber();
    const opcallScript = bitcoinjs_lib_1.script.compile([
        opcodes_1.OPS.OP_4,
        script_number_1.encode(gasLimit),
        script_number_1.encode(gasPrice),
        buffer_1.Buffer.from(encodedData, "hex"),
        buffer_1.Buffer.from(contractAddress, "hex"),
        opcodes_1.OPS.OP_CALL,
    ]);
    while (amount > 0) {
        const { inputs, fee: txfee } = coinSelect(utxos, [
            { value: gasLimitFee },
            { script: opcallScript, value: amount },
        ], feeRate);
        if (inputs != null) {
            return amount;
        }
        amount -= 10000;
    }
    return 0;
}
exports.estimateSendToContractTransactionMaxValue = estimateSendToContractTransactionMaxValue;
/**
 * Build a send-to-contract transaction
 *
 * @param keyPair
 * @param contractAddress
 * @param encodedData
 * @param feeRate Fee per byte of tx. (unit: satoshi / byte)
 * @param utxoList
 * @returns the built tx
 */
function buildSendToContractTransaction(utxos, keyPair, contractAddress, encodedData, feeRate, opts = {}) {
    // feeRate must be an integer number, or coinselect would always fail
    feeRate = Math.floor(feeRate);
    const gasLimit = opts.gasLimit || defaultContractSendTxOptions.gasLimit;
    const gasPrice = opts.gasPrice || defaultContractSendTxOptions.gasPrice;
    const amount = opts.amount || defaultContractSendTxOptions.amount;
    ensureAmountInteger(amount);
    const senderAddress = keyPair.getAddress();
    // excess gas will refund in the coinstake tx of the mined block
    const gasLimitFee = new bignumber_js_1.BigNumber(gasLimit).times(gasPrice).toNumber();
    const opcallScript = bitcoinjs_lib_1.script.compile([
        opcodes_1.OPS.OP_4,
        script_number_1.encode(gasLimit),
        script_number_1.encode(gasPrice),
        buffer_1.Buffer.from(encodedData, "hex"),
        buffer_1.Buffer.from(contractAddress, "hex"),
        opcodes_1.OPS.OP_CALL,
    ]);
    const { inputs, fee: txfee } = coinSelect(utxos, [
        { value: gasLimitFee },
        { script: opcallScript, value: amount },
    ], feeRate);
    if (inputs == null) {
        throw new Error("could not find UTXOs to build transaction");
    }
    const txb = new bitcoinjs_lib_1.TransactionBuilder(keyPair.getNetwork());
    // add inputs to txb
    let vinSum = new bignumber_js_1.BigNumber(0);
    for (const input of inputs) {
        txb.addInput(input.hash, input.pos);
        vinSum = vinSum.plus(input.value);
    }
    // send-to-contract output
    txb.addOutput(opcallScript, amount);
    // change output (in satoshi)
    const change = vinSum
        .minus(txfee)
        .minus(gasLimitFee)
        .minus(amount)
        .toNumber();
    if (change > 0) {
        txb.addOutput(senderAddress, change);
    }
    for (let i = 0; i < inputs.length; i++) {
        txb.sign(i, keyPair);
    }
    return txb.build().toHex();
}
exports.buildSendToContractTransaction = buildSendToContractTransaction;
// The prevalent network fee is 0.004 per KB. If set to 100 times of norm, assume error.
const MAX_FEE_RATE = Math.ceil((0.004 * 100 * 1e8) / 1024);
function checkFeeRate(feeRate) {
    if (feeRate > MAX_FEE_RATE) {
        throw new Error("Excessive tx fees, is set to 100 times of norm.");
    }
}
//# sourceMappingURL=tx.js.map