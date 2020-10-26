"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const _1 = require("./");
const bcsRPC_1 = require("./bcsRPC");
const time_1 = require("./time");
const scrypt_1 = require("./scrypt");
describe("Wallet", () => {
    const network = _1.networks.regtest;
    it("generates mnemonic of 12 words", () => {
        const mnemonic = _1.generateMnemonic();
        chai_1.assert.isString(mnemonic);
        const words = mnemonic.split(" ");
        chai_1.assert.equal(words.length, 12);
    });
    const testMnemonic = "behind lunar size snap unfold stereo case shift flavor shove cricket divorce";
    const password = "covfefe";
    it("recovers wallet from mnemonic", () => __awaiter(this, void 0, void 0, function* () {
        const wallet = yield network.fromMnemonic(testMnemonic);
        chai_1.assert.equal(wallet.address, "qPVw7ZSjV8G2Xdr6rtxhR2riWf9SDkzDVo");
    }));
    it("recovers wallet from mnemonic with password", () => __awaiter(this, void 0, void 0, function* () {
        const wallet = yield network.fromMnemonic(testMnemonic, password);
        chai_1.assert.equal(wallet.address, "qJSUjMyHRZ4J1DmsCKd4R14cmb8CAWLZG8");
    }));
    const wifPrivateKey = "cMbgxCJrTYUqgcmiC1berh5DFrtY1KeU4PXZ6NZxgenniF1mXCRk";
    it("recovers wallet from WIF", () => {
        const wallet = network.fromWIF(wifPrivateKey);
        chai_1.assert.equal(wallet.address, "qUbxboqjBRp96j3La8D1RYkyqx5uQbJPoW");
    });
    it("recovers wallet from EncryptedPrivateKey", () => {
        const wif = "cNQKccYYQyGX9G9Qxq2DJev9jHygbZpb2UG7EvUapbtDx5XhkhYE";
        const encryptPassword = "testtest";
        const wallet = network.fromWIF(wif);
        const encryptedKey = wallet.toEncryptedPrivateKey(encryptPassword, scrypt_1.params.noop);
        const wallet2 = network.fromEncryptedPrivateKey(encryptedKey, encryptPassword, scrypt_1.params.noop);
        chai_1.assert.equal(wallet2.toWIF(), wif);
    });
    it("dumps wallet to WIF", () => {
        const wallet = network.fromWIF(wifPrivateKey);
        chai_1.assert.equal(wallet.toWIF(), wifPrivateKey);
    });
    it("gets wallet info", function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            const wallet = network.fromWIF(wifPrivateKey);
            const info = yield wallet.getInfo();
            chai_1.assert.containsAllKeys(info, [
                "addrStr",
                "balance",
                "balanceSat",
                "totalReceived",
                "totalReceivedSat",
                "totalSent",
                "totalSentSat",
                "transactions",
            ]);
        });
    });
    it("gets wallet transactions", function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            const wallet = network.fromWIF(wifPrivateKey);
            const rawTxs = yield wallet.getTransactions();
            chai_1.assert.containsAllKeys(rawTxs, ["txs", "pagesTotal"]);
            chai_1.assert.isArray(rawTxs.txs);
        });
    });
    it("sends payment to a receiving address", function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            const insight = network.insight();
            const wallet = network.fromWIF(wifPrivateKey);
            const toAddress = "qLn9vqbr2Gx3TsVR9QyTVB5mrMoh4x43Uf";
            const amount = 1e8; // 1 bcs (in sat)
            const senderOldInfo = yield insight.getInfo(wallet.address);
            const receiverOldInfo = yield insight.getInfo(toAddress);
            const tx = yield wallet.send(toAddress, amount, {
                feeRate: 4000,
            });
            chai_1.assert.isNotEmpty(tx.txid);
            yield bcsRPC_1.generateBlock(network);
            yield time_1.sleep(2000);
            const senderNewInfo = yield insight.getInfo(wallet.address);
            const receiverNewInfo = yield insight.getInfo(toAddress);
            chai_1.assert.equal(senderOldInfo.balanceSat - senderNewInfo.balanceSat, Math.round(1.009 * 1e8), "sender");
            chai_1.assert.equal(receiverNewInfo.balanceSat - receiverOldInfo.balanceSat, 1e8, "receiver");
        });
    });
});
//# sourceMappingURL=Wallet.test.js.map