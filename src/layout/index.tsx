import React, {forwardRef} from "react";
import Body from "./body";
import Footer from "./footer";
import Header from "./header";
import Sider from "./sider";
import 'dayjs/locale/zh-cn';

import SkLayout, {LayoutProps, SinKingRef} from "./sinking";

const Layout: React.FC<LayoutProps> = forwardRef<SinKingRef>((props: any, ref) => {
    return <SkLayout ref={ref} {...props}/>;
});

export {
    Body,
    Footer,
    Header,
    Sider,
}

export default Layout;