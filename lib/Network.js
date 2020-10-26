"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const bip38 = __importStar(require("bip38"));
const bip39 = __importStar(require("bip39"));
const wifEncoder = __importStar(require("wif"));
const Wallet_1 = require("./Wallet");
const Insight_1 = require("./Insight");
const index_1 = require("./index");
const scrypt_1 = require("./scrypt");
const constants_1 = require("./constants");
var constants_2 = require("./constants");
exports.NetworkNames = constants_2.NetworkNames;
exports.networksInfo = {
    [constants_1.NetworkNames.MAINNET]: {
        name: constants_1.NetworkNames.MAINNET,
        messagePrefix: "\u0015BCS Signed Message:\n",
        bech32: "bc",
        bip32: { public: 76067358, private: 76066276 },
        pubKeyHash: 25,
        scriptHash: 50,
        wif: 128,
    },
    [constants_1.NetworkNames.TESTNET]: {
        name: constants_1.NetworkNames.TESTNET,
        messagePrefix: "\u0015BCS Signed Message:\n",
        bech32: "tb",
        bip32: { public: 70617039, private: 70615956 },
        pubKeyHash: 85,
        scriptHash: 110,
        wif: 239,
    },
    [constants_1.NetworkNames.REGTEST]: {
        name: constants_1.NetworkNames.REGTEST,
        messagePrefix: "\u0015BCS Signed Message:\n",
        bech32: "tb",
        bip32: { public: 70617039, private: 70615956 },
        pubKeyHash: 85,
        scriptHash: 110,
        wif: 239,
    },
};
class Network {
    constructor(info) {
        this.info = info;
    }
    /**
     * Restore a HD-wallet address from mnemonic & password
     *
     * @param mnemonic
     * @param password
     *
     */
    fromMnemonic(mnemonic, password) {
        // if (bip39.validateMnemonic(mnemonic) == false) return false
        const seedHex = bip39.mnemonicToSeedHex(mnemonic, password);
        const hdNode = bitcoinjs_lib_1.HDNode.fromSeedHex(seedHex, this.info);
        const account = hdNode
            .deriveHardened(88)
            .deriveHardened(0)
            .deriveHardened(0);
        const keyPair = account.keyPair;
        return new Wallet_1.Wallet(keyPair, this.info);
    }
    /**
     * constructs a wallet from bip38 encrypted private key
     * @param encrypted private key string
     * @param passhprase password
     * @param scryptParams scryptParams
     */
    fromEncryptedPrivateKey(encrypted, passhprase, scryptParams = scrypt_1.params.bip38) {
        const { privateKey, compressed } = bip38.decrypt(encrypted, passhprase, undefined, scryptParams);
        const decoded = wifEncoder.encode(this.info.wif, privateKey, compressed);
        return this.fromWIF(decoded);
    }
    /**
     * Restore 10 wallet addresses exported from BCS's mobile clients. These
     * wallets are 10 sequential addresses rooted at the HD-wallet path
     * `m/88'/0'/0'` `m/88'/0'/1'` `m/88'/0'/2'`, and so on.
     *
     * @param mnemonic
     * @param network
     */
    fromMobile(mnemonic) {
        const seedHex = bip39.mnemonicToSeedHex(mnemonic);
        const hdNode = bitcoinjs_lib_1.HDNode.fromSeedHex(seedHex, this.info);
        const account = hdNode.deriveHardened(88).deriveHardened(0);
        const wallets = [];
        for (let i = 0; i < 10; i++) {
            const hdnode = account.deriveHardened(i);
            const wallet = new Wallet_1.Wallet(hdnode.keyPair, this.info);
            wallets.push(wallet);
        }
        return wallets;
    }
    /**
     * Restore wallet from private key specified in WIF format:
     *
     * See: https://en.bitcoin.it/wiki/Wallet_import_format
     *
     * @param wif
     */
    fromWIF(wif) {
        if (!index_1.validatePrivateKey(wif)) {
            throw new Error("wif is invalid, it does not satisfy ECDSA");
        }
        const keyPair = bitcoinjs_lib_1.ECPair.fromWIF(wif, this.info);
        return new Wallet_1.Wallet(keyPair, this.info);
    }
    /**
     * Alias for `fromWIF`
     * @param wif
     */
    fromPrivateKey(wif) {
        return this.fromWIF(wif);
    }
    insight() {
        return Insight_1.Insight.forNetwork(this.info);
    }
}
exports.Network = Network;
const mainnet = new Network(exports.networksInfo[constants_1.NetworkNames.MAINNET]);
const testnet = new Network(exports.networksInfo[constants_1.NetworkNames.TESTNET]);
const regtest = new Network(exports.networksInfo[constants_1.NetworkNames.REGTEST]);
exports.networks = {
    mainnet,
    testnet,
    regtest,
};
//# sourceMappingURL=Network.js.map