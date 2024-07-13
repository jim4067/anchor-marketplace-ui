"use client"; // to make umi happy

import { useUmi } from "@/app/hooks/umi";
import { fetchAssetByMint } from "@/app/lib/data";
import { ListedAsset, MarketplaceAsset } from "@/app/lib/definations";
import { clipAddress } from "@/app/lib/utils";
import { Button } from "@/app/ui/elements/Button";
import { css } from "@/styled-system/css";
import { container, flex } from "@/styled-system/patterns";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useListAsset, usePurchaseAsset, useUnlistAsset } from "./hooks";

export default function Page({ params }: { params: { mint: string } }) {
	const { publicKey } = useWallet();
	const { umiInstance } = useUmi();

	const { listAsset } = useListAsset();
	const { unlistAsset } = useUnlistAsset();
	const { purchaseAsset } = usePurchaseAsset();

	const [listPrice, setListPrice] = useState<number>(0);

	const [listedAssets, setListedAssets] = useState<ListedAsset[]>(() => {
		if (!global?.window) return [];
		const listedItems = JSON.parse(localStorage.getItem("listed") ?? "[]");
		return listedItems;
	});

	const [isListed, setIsListed] = useState<boolean>((): boolean => {
		if (!global?.window) return false;
		const stored = localStorage.getItem(params.mint);
		return !!stored;
	});

	const [asset, setAsset] = useState<ListedAsset | MarketplaceAsset>(() => {
		if (!global?.window) return;
		const stored = localStorage.getItem(params.mint);
		return stored ? JSON.parse(stored) : undefined;
	});

	const isOwnerListing =
		isListed && asset?.token?.owner === publicKey?.toBase58();

	useEffect(() => {
		if (!publicKey || !umiInstance) return;

		// if not listed request asset details
		if (!isListed) {
			fetchAssetByMint(umiInstance, params.mint, publicKey)
				.then((res) => setAsset(res))
				.catch(console.error);
			return;
		}
	}, [publicKey, umiInstance, isListed, params]);

	return (
		<section
			className={flex({
				backgroundColor: "primaryBackground",
				flex: 1,
			})}
		>
			<section className={container({})}>
				<section
					className={flex({
						gap: 10,
						flexWrap: "wrap",
						flexDir: { base: "row", mdDown: "column" },
					})}
				>
					<section
						className={css({
							width: { base: "2200px", smOnly: "inherit" },
							maxW: { base: "fit-content" },
						})}
					>
						<Image
							style={{
								height: "650px",
								objectFit: "cover",
								width: "600px",
							}}
							alt="Asset cover image"
							src={asset?.image as string}
							height={550}
							width={500}
						/>
					</section>
					<section
						className={flex({
							gap: 32,
							flexDir: "column",
							justifyContent: "space-between",
						})}
					>
						<section
							className={flex({
								gap: 2,
								flexDir: "column",
							})}
						>
							<section
								className={css({
									fontSize: " headline30",
									fontWeight: " headline30",
								})}
							>
								{asset?.name}
							</section>
							<section>
								Owned by{" "}
								{clipAddress(asset?.token?.owner ?? "")}
							</section>
						</section>

						<section
							className={flex({
								gap: 10,
								flexDir: "column",
							})}
						>
							{isListed && (
								<>
									<section
										className={flex({
											gap: 2,
											flexDir: "column",
										})}
									>
										<div
											className={css({
												fontSize: "regular14",
												fontWeight: "regular14",
												color: "textTertiary",
											})}
										>
											current Price
										</div>
										<div
											className={css({
												fontSize: " headline30",
												fontWeight: " headline30",
											})}
										>
											{/* 
 												// @ts-ignore */}
											{asset?.price / LAMPORTS_PER_SOL}{" "}
											SOL
										</div>
									</section>

									<section>
										<Button
											onClick={() =>
												isOwnerListing
													? unlistAsset(
															params.mint,
															listedAssets
														)
													: purchaseAsset(
															params.mint,
															asset?.token
																?.owner as string,
															listedAssets
														)
											}
										>
											{isOwnerListing
												? "Unlist Asset"
												: "Buy Now"}
										</Button>
									</section>
								</>
							)}

							{!isListed && (
								<section
									className={flex({
										gap: 4,
										flexDir: "column",
									})}
								>
									<section>
										<input
											type="number"
											className={flex({
												fontSize: "headline40",
												padding: 2,
												gap: 4,
												lineHeight: 0,
												outline: "none",
												textAlign: "left",
											})}
											value={listPrice}
											placeholder="0.0 SOL"
											onChange={({
												target: { value },
											}: any) => setListPrice(value)}
										/>
									</section>
									<section>
										<Button
											onClick={() =>
												listAsset(
													params.mint,
													listPrice,
													asset,
													listedAssets
												)
											}
										>
											List Asset
										</Button>
									</section>
								</section>
							)}
						</section>
					</section>
				</section>
			</section>
		</section>
	);
}
