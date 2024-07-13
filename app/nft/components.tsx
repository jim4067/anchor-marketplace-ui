"use client";

import {
	DigitalAsset,
	fetchAllDigitalAssetByOwner,
} from "@metaplex-foundation/mpl-token-metadata";

import { isSome, publicKey as UmiPublicKey } from "@metaplex-foundation/umi";

import { css } from "@/styled-system/css";
import { flex } from "@/styled-system/patterns";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
	PublicKey,
	Transaction,
	TransactionInstruction,
} from "@solana/web3.js";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useSolquestSDK } from "../hooks/sdk";
import { useUmi } from "../hooks/umi";
import { Card } from "../ui/components/Card";
import TabRoot, {
	TabContent,
	TabHeader,
	TabHeaderList,
} from "../ui/components/Tabs";
import { SelectAllBtn, StakeBtn } from "../ui/elements/Button";

export function Header() {
	return (
		<section
			className={flex({
				flexDir: "column",
				gap: 2,
			})}
		>
			<section
				className={flex({
					justifyContent: "space-between",
					flexWrap: "wrap",
					gap: 8,
				})}
			>
				<section
					className={css({
						color: "textSecondary",
						fontSize: "headline40",
						whiteSpace: "nowrap",
					})}
				>
					NFT Staking
				</section>
				<section
					className={flex({
						gap: 4,
					})}
				>
					<Rewards label="Claimable Rewards" value="93.47 FORGE" />
					<span
						className={css({
							borderColor: "borderTertiary",
							borderWidth: "0.5px",
						})}
					/>
					<Rewards label="Daily Rewards" value="30 FORGE" />
				</section>
			</section>
			<section>
				<hr
					className={css({
						borderColor: "borderTertiary",
						borderWidth: "0.5px",
					})}
				/>
			</section>
		</section>
	);
}

type RewardsProps = {
	label: string;
	value: string;
};
export function Rewards({ label, value }: RewardsProps) {
	return (
		<section>
			<section
				className={css({
					color: "textTertiary",
					fontSize: "regular14",
				})}
			>
				{label}
			</section>
			<section
				className={css({
					color: "textSecondary",
					fontSize: "regular24",
				})}
			>
				{value}
			</section>
		</section>
	);
}

type SolquestNFTType = Partial<DigitalAsset & { image: string; name: string }>;
type CardListProps = {
	nfts: Array<SolquestNFTType>;
	onClick: (nft: SolquestNFTType, id: number) => void;
};
function CardList({ nfts, onClick }: CardListProps) {
	const [selectedIndices, setSelectedIndices] = useState<Array<number>>([]);

	const handleClick = (nft: SolquestNFTType, index: number) => {
		setSelectedIndices((prevSelected: any) => {
			if (prevSelected.includes(index)) {
				return prevSelected.filter((i: number) => i !== index);
			} else {
				return [...prevSelected, index];
			}
		});
		onClick(nft, index);
	};

	return (
		<section
			className={flex({
				gap: 12,
				justifyContent: "space-between",
				flexWrap: "wrap",
			})}
		>
			{nfts?.map((nft, index) => (
				<Card
					key={index}
					title={nft?.name ?? "unknown"}
					collection={nft?.metadata?.name ?? ""}
					// collection={nft.metadata.collection ?? ""}
					image={nft?.image ?? ""}
					// onClick={() => handleClick(nft, index)}
					// isSelected={selectedIndices.includes(index)}
				/>
			))}
		</section>
	);
}

export function NFTTabs() {
	const { publicKey, sendTransaction, signTransaction } = useWallet();
	const { connection } = useConnection();

	const { umiInstance } = useUmi();
	const { solquestNFT } = useSolquestSDK();

	const [unstakedUserAssets, setUnstakedUserAssets] = useState<any>();
	const [stakedUserAssets, setStakedUserAssets] = useState<any[]>(() => {
		const stored = localStorage.getItem("staked");
		return stored ? JSON.parse(stored) : [];
	});

	const [selectedToStake, setSelectedToStake] = useState<any[]>([]);

	const fetchAssets = useCallback(async () => {
		if (!publicKey || !umiInstance) {
			return;
		}

		const digitalAssets = await fetchAllDigitalAssetByOwner(
			umiInstance,
			UmiPublicKey(publicKey)
		);

		// filter out collections
		const res = await Promise.all(
			digitalAssets
				.filter((asset) => isSome(asset.metadata.collection))
				.filter(
					(asset) =>
						!new Set(
							stakedUserAssets?.map(
								(stakedAsset) => stakedAsset.mint.publicKey
							)
						).has(asset.mint.publicKey)
				)
				.map(async (asset) => {
					const offChainData = (await axios.get(asset.metadata.uri))
						.data;
					return {
						image: offChainData.image,
						name: offChainData.name,
						mint: asset.mint,
						asset,
						offChainData,
					};
				})
		);

		return res;
	}, [publicKey, umiInstance, stakedUserAssets]);

	useEffect(() => {
		if (!publicKey || !umiInstance) {
			return;
		}

		// // fetch unstaked user assets
		// fetchAssets()
		// 	.then((res) => setUnstakedUserAssets(res))
		// 	.catch(console.error);
	}, [fetchAssets, publicKey, umiInstance, stakedUserAssets]);

	const handleStakeSelected = useCallback(async () => {
		if (!selectedToStake || !solquestNFT || !signTransaction) {
			return;
		}
		if (selectedToStake && selectedToStake?.length > 12) {
			alert("cannot stake more than items at a time");
			return;
		}
		const stakeIxs = await Promise.all(
			selectedToStake.map(
				async (asset): Promise<TransactionInstruction> => {
					return await solquestNFT.stakeNFT(
						new PublicKey(asset.mint.publicKey),
						new PublicKey(asset.metadata.collection.key)
					);
				}
			)
		);
		// transaction
		const tx = new Transaction().add(...stakeIxs);
		await sendTransaction(tx, connection);
		// save the asset inside window storage
		if (!stakedUserAssets) {
			localStorage.setItem("staked", JSON.stringify(selectedToStake));
			return;
		}
		localStorage.setItem(
			"staked",
			JSON.stringify([...selectedToStake, ...stakedUserAssets])
		);
	}, [
		selectedToStake,
		solquestNFT,
		signTransaction,
		sendTransaction,
		connection,
		stakedUserAssets,
	]);

	const handleSelection = (solqAsset: SolquestNFTType) => {
		setSelectedToStake((prevSelected: Array<SolquestNFTType>) => {
			const isAlreadySelected = prevSelected.some(
				(n: SolquestNFTType) =>
					n.mint?.publicKey.toString() ===
					solqAsset.mint?.publicKey.toString()
			);

			if (isAlreadySelected) {
				return prevSelected.filter(
					(n: SolquestNFTType) =>
						n.mint?.publicKey.toString() !==
						solqAsset.mint?.publicKey.toString()
				);
			} else {
				return [...prevSelected, solqAsset];
			}
		});
	};

	return (
		<section>
			<TabRoot defaultTab="Staked">
				<TabHeaderList>
					<section className={flex({ gap: 4 })}>
						<TabHeader label="Staked" />
						<TabHeader label="Unstaked" />
					</section>
					<section className={flex({ gap: 4, margin: "auto 0" })}>
						<SelectAllBtn
							onClick={() => console.log("select all button")}
						/>
						<StakeBtn onClick={handleStakeSelected} />
					</section>
				</TabHeaderList>
				<TabContent value="Staked">
					<CardList
						// @ts-ignore
						nfts={stakedUserAssets}
						onClick={() => console.log("cant stake a staked asset")}
					/>
				</TabContent>
				<TabContent value="Unstaked">
					<CardList
						nfts={unstakedUserAssets}
						onClick={(nft, id) => handleSelection(nft)}
					/>
				</TabContent>
			</TabRoot>
		</section>
	);
}
