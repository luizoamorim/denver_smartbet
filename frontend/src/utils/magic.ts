import { Magic } from "magic-sdk";

let magic;

if (typeof window !== "undefined") {
    magic = new Magic(
        process.env.NODE_ENV === "development"
            ? (process.env.NEXT_PUBLIC_MAGIC_LINK_PK as string)
            : (process.env.MAGIC_LINK_PK as string),
        {
            network: {
                rpcUrl: `https://polygon-mumbai.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`,
                chainId: 5,
            },
        },
    );
}

export default magic as Magic;
