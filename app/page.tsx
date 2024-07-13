import { css } from "@/styled-system/css";
import { container, flex } from "@styled-system/patterns";
import { DisplayAssets } from "./ui/components/UserAssets";

export default function Page() {
	return (
		<section
			className={css({
				backgroundColor: "primaryBackground",
				color: "textSecondary",
				flex: 1,
			})}
		>
			<section className={container({})}>
				<section
					className={flex({
						gap: 10,
						flexDir: "column",
					})}
				>
					<section
						className={css({
							fontSize: " headline30",
							fontWeight: " headline30",
							flexWrap: "wrap",
						})}
					>
						Listed Assets
					</section>

					<section>
						<DisplayAssets display="listed" />
					</section>
				</section>
			</section>
		</section>
	);
}
