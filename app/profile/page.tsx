import { container, flex } from "@/styled-system/patterns";
import { DisplayAssets } from "../ui/components/UserAssets";

export default function Page() {
	return (
		<section
			className={flex({
				backgroundColor: "primaryBackground",
				flex: 1,
				justifyContent: "center",
			})}
		>
			<section className={container({})}>
				<DisplayAssets display="all" />
			</section>
		</section>
	);
}
