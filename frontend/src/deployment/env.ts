const env = {
    MAGIC_LINK_PK:
        process.env.NODE_ENV === "production"
            ? process.env.MAGIC_LINK_PK
            : process.env.INFURA_ID,
    INFURA_ID:
        process.env.NODE_ENV === "production"
            ? process.env.MAGIC_LINK_PK
            : process.env.NEXT_PUBLIC_INFURA_ID,
    USDC_CONTRACT_ADDRESS:
        process.env.NODE_ENV === "production"
            ? process.env.USDC_CONTRACT_ADDRESS
            : process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS,
    SMARTBET_CONTRACT_ADDRESS:
        process.env.NODE_ENV === "production"
            ? process.env.SMARTBET_CONTRACT_ADDRESS
            : process.env.NEXT_PUBLIC_SMARTBET_CONTRACT_ADDRESS,
};

export default env;
