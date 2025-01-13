const express = require('express');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3005;

// BSC USDT and Aave V3 addresses
const CONFIG = {
    name: "BSC Mainnet",
    rpcUrl: process.env.BSC_RPC_URL,
    poolAddressesProvider: "0x770ef9f4fe897e59daCc474EF11238303F9552b6", // Aave V3 BSC
    usdtAddress: "0x55d398326f99059fF775485246999027B3197955"  // BSC USDT
};

// Minimal ABIs
const POOL_ADDRESSES_PROVIDER_ABI = [
    "function getPool() external view returns (address)"
];

const POOL_ABI = [
    "function FLASHLOAN_PREMIUM_TOTAL() external view returns (uint128)",
    "function getReserveData(address asset) external view returns (tuple(uint256 unbacked, uint256 accruedToTreasuryScaled, uint256 totalAToken, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp) memory)"
];

// Initialize provider and contracts
async function getContracts() {
    const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcUrl);
    const addressesProvider = new ethers.Contract(
        CONFIG.poolAddressesProvider,
        POOL_ADDRESSES_PROVIDER_ABI,
        provider
    );

    const poolAddress = await addressesProvider.getPool();
    const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);

    return { pool, provider };
}

// Get flash loan premium rate
app.get('/api/flash-loan/premium', async (req, res) => {
    try {
        const { pool } = await getContracts();
        const premium = await pool.FLASHLOAN_PREMIUM_TOTAL();
        const premiumPercentage = (premium / 10000).toFixed(3);

        res.json({
            network: CONFIG.name,
            premium: premium.toString(),
            premiumPercentage: `${premiumPercentage}%`
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: error.message || "Failed to fetch flash loan premium"
        });
    }
});

// Calculate flash loan fee for USDT
app.get('/api/flash-loan/calculate-fee/:amount', async (req, res) => {
    try {
        const { amount } = req.params;
        const { pool } = await getContracts();

        const premium = await pool.FLASHLOAN_PREMIUM_TOTAL();
        const premiumPercentage = (premium / 10000).toFixed(3);
        const fee = (BigInt(amount) * BigInt(premium)) / BigInt(10000);

        // Get USDT reserve data
        const reserveData = await pool.getReserveData(CONFIG.usdtAddress);

        res.json({
            network: CONFIG.name,
            token: "USDT",
            amount,
            premium: premium.toString(),
            premiumPercentage: `${premiumPercentage}%`,
            fee: fee.toString(),
            reserveData: {
                totalAToken: reserveData.totalAToken.toString(),
                totalStableDebt: reserveData.totalStableDebt.toString(),
                totalVariableDebt: reserveData.totalVariableDebt.toString(),
                liquidityRate: reserveData.liquidityRate.toString()
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: error.message || "Failed to calculate flash loan fee"
        });
    }
});

app.listen(port, () => {
    console.log(`BSC USDT Flash loan fee checker API running on port ${port}`);
});