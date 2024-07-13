"use client";

import { Umi } from "@metaplex-foundation/umi";

import { useUmi } from "@/app/hooks/umi";
import { fetchUserAssets } from "@/app/lib/data";
import { ListedAsset, MarketplaceAsset } from "@/app/lib/definations";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { CardList } from "./Card";

type Display = "all" | "listed" | "unlisted" | "listedUser";
type DisplayUserAssetsProps = {
	display: Display;
};
export function DisplayAssets({ display }: DisplayUserAssetsProps) {
	const { publicKey } = useWallet();
	const { umiInstance } = useUmi();

	const [listedMarketplaceAssets, setListedUserAssets] = useState<
		ListedAsset[]
	>(() => {
		if (!global?.window) return [];

		const stored = localStorage.getItem("listed");
		return stored ? JSON.parse(stored) : [];
	});

	const [assets, setAssets] = useState<MarketplaceAsset[] | ListedAsset[]>(
		[]
	);

	const unlistedUserAssets = useCallback(
		async (umiInstance: Umi, publicKey: PublicKey) => {
			try {
				const unlisted = (
					await fetchUserAssets(umiInstance, publicKey)
				).filter(
					(asset) =>
						!new Set(
							listedMarketplaceAssets?.map(
								(listedAsset) => listedAsset?.mint?.publicKey
							)
						).has(asset?.mint?.publicKey)
				);

				return unlisted;
			} catch (err) {
				console.error(err);
			}
		},
		[listedMarketplaceAssets]
	);

	useEffect(() => {
		if (!publicKey || !umiInstance) {
			return;
		}

		// fetch all user assets
		if (display === "all") {
			fetchUserAssets(umiInstance, publicKey)
				.then((assets) => {
					setAssets(assets);
					console.log(assets);
				})
				.catch(console.error);
		}

		//fetch listed assets
		if (display === "listed") {
			setAssets(listedMarketplaceAssets);
		}

		if (display === "listedUser") {
			let listedUser = listedMarketplaceAssets.filter(
				(asset) => asset?.token?.owner === publicKey.toBase58()
			);
			setAssets(listedUser);
		}

		// fetch unlisted user assets
		if (display === "unlisted") {
			unlistedUserAssets(umiInstance, publicKey)
				.then((res) => {
					if (!res) return;
				})
				.catch(console.error);
		}
	}, [
		publicKey,
		display,
		umiInstance,
		listedMarketplaceAssets,
		unlistedUserAssets,
	]);
	return (
		<section>
			{assets.length === 0 && <>No assets to display</>}
			<CardList assets={assets} />
		</section>
	);
}
