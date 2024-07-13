import { css } from "@/styled-system/css";
import { container } from "@/styled-system/patterns";

import { Header, NFTTabs } from "./components";

export default function NFT() {
	return (
		<section
			className={css({
				backgroundColor: "primaryBackground",
				flex: 1,
			})}
		>
			<section
				className={container({
					display: "flex",
					gap: 10,
					flexDir: "column",
				})}
			>
				<Header />
				<NFTTabs />
			</section>
		</section>
	);
}
