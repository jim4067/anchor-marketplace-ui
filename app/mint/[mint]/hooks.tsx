// useAsset.js
import { BN } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { useCallback } from "react";

import { useMarketplaceSDK } from "@/app/hooks/sdk";
import { ListedAsset, MarketplaceAsset } from "@/app/lib/definations";
import { removeFromListedAssets, updateLocalStorage } from "@/app/lib/utils";
import { unwrapOption } from "@metaplex-foundation/umi";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

export function useListAsset() {
	const { sendTransaction } = useWallet();
	const { connection } = useConnection();
	const { marketplaceSDK } = useMarketplaceSDK();

	const listAsset = useCallback(
		async (
			mint: string,
			listPrice: number,
			asset: MarketplaceAsset,
			listedAssets: ListedAsset[]
		) => {
			if (!marketplaceSDK || !asset?.metadata?.collection) return;

			try {
				const updatedAssets = [...listedAssets, asset];
				updateLocalStorage("listed", updatedAssets);
				updateLocalStorage(mint, {
					...asset,
					price: listPrice * LAMPORTS_PER_SOL,
				});

				let collectionAddress = unwrapOption(
					asset?.metadata?.collection
				)?.key;
				if (!collectionAddress) return;

				const ix = await marketplaceSDK.list(
					new PublicKey(mint),
					new PublicKey(collectionAddress),
					new BN(listPrice * LAMPORTS_PER_SOL)
				);

				const tx = new Transaction().add(ix);
				await sendTransaction(tx, connection, { skipPreflight: true });
			} catch (err) {
				console.error(err);
			}
		},
		[connection, marketplaceSDK, sendTransaction]
	);

	return { listAsset };
}

export function useUnlistAsset() {
	const { sendTransaction } = useWallet();
	const { connection } = useConnection();
	const { marketplaceSDK } = useMarketplaceSDK();

	const unlistAsset = useCallback(
		async (mint: string, listedAssets: ListedAsset[]) => {
			if (!marketplaceSDK) return;

			try {
				let remaining = removeFromListedAssets(mint, listedAssets);
				updateLocalStorage("listed", remaining);
				localStorage.removeItem(mint);

				const ix = await marketplaceSDK.delist(new PublicKey(mint));

				const tx = new Transaction().add(ix);
				await sendTransaction(tx, connection);
			} catch (err) {
				console.error(err);
			}
		},
		[connection, marketplaceSDK, sendTransaction]
	);

	return { unlistAsset };
}

export function usePurchaseAsset() {
	const { sendTransaction } = useWallet();
	const { connection } = useConnection();
	const { marketplaceSDK } = useMarketplaceSDK();

	const purchaseAsset = useCallback(
		async (mint: string, owner: string, listedAssets: ListedAsset[]) => {
			if (!marketplaceSDK) return;

			try {
				let remaining = removeFromListedAssets(mint, listedAssets);
				updateLocalStorage("listed", remaining);
				localStorage.removeItem(mint);

				const ix = await marketplaceSDK.purchase(
					new PublicKey(mint),
					new PublicKey(owner)
				);

				const tx = new Transaction().add(ix);
				await sendTransaction(tx, connection);
			} catch (err) {
				console.error(err);
			}
		},
		[connection, marketplaceSDK, sendTransaction]
	);

	return { purchaseAsset };
}
