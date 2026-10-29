import React, {forwardRef} from "react";
import {StyleBoundary} from "../theme";
import Body from "./body";
import Footer from "./footer";
import Header from "./header";
import Sider from "./sider";
import 'dayjs/locale/zh-cn';

import SkLayout, {LayoutProps, SinKingRef} from "./sinking";

const Layout: React.FC<LayoutProps> = forwardRef<SinKingRef>((props: any, ref) => {
    return <StyleBoundary enabled={props.styleProvider}>
        <SkLayout ref={ref} {...props}/>
    </StyleBoundary>;
});

export {
    Body,
    Footer,
    Header,
    Sider,
}

export default Layout;