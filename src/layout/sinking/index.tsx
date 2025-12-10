import Footer from "../footer";
import Header from "../header";
import Sider from "../sider";
import BreadCrumb from "../../breadcrumb";
import {createStyles, useResponsive, useTheme} from "antd-style";
import React, {forwardRef, useImperativeHandle, useState} from "react";
import {MenuFoldOutlined, MenuUnfoldOutlined} from "@ant-design/icons";
import {App, Button, Drawer, Layout, Watermark, Spin} from "antd";

/**
 * Loading 加载样式
 */
const useLoadingStyles = createStyles((): any => {
    return {
        body: {
            width: "100%",
            margin: "0 auto",
            lineHeight: "80vh"
        },
    };
});

/**
 * Loading 加载组件
 */
const Loading: React.FC = () => {
    const {styles: {body}} = useLoadingStyles();
    return <Spin size="large" className={body}/>;
};

const useLayoutStyles = createStyles(({isDarkMode, token, css, responsive}): any => {
    return {
        container: {
            display: "flex",
            flexDirection: "row",
        },
        sider: {
            zIndex: 2,
            boxShadow: "2px 0 8px 0 rgba(29,35,41,.05)",
            background: "none !important",
            height: '100vh',
            overflowY: "auto",
            position: "sticky",
            left: 0,
            top: 0,
            bottom: 0,
            transition: "all 0.3s,background 0s,height 0s",
            ".ant-layout-header": {
                backgroundColor: token?.colorBgContainer
            },
        },
        menuBtn: {
            width: "55px !important",
            height: "55px",
            lineHeight: "55px",
            fontSize: "15px !important",
            cursor: "pointer",
            float: "left",
            ":hover": {
                background: "none !important",
            }
        },
        drawMenu: {
            padding: "0px !important",
        },
        body: css`
            transition: margin-left 0.3s !important;
            background-color: ${isDarkMode ? "black" : "transparent"};
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        `,
        sticky: {
            position: "sticky",
            top: 0,
            left: 0,
        },
        header: css`
            padding: 0;
            height: 55px;
            line-height: 55px;
            width: 100%;
            z-index: 3;
            box-shadow: 0 2px 8px 0 ${isDarkMode ? "rgba(0, 0, 0, 0.25)" : "rgba(29, 35, 41, 0.05)"};
            user-select: none;
            background: ${token?.colorBgContainer} !important;
            flex-shrink: 0;

            .ant-menu-item-icon {
                color: ${isDarkMode ? "rgb(255,255,255,0.85)" : ""};
            }
        `,
        horizontalContent: css`
            width: 100%;
            flex: 1 0 auto;
        `,
        inlineContent: css`
            width: 100%;
            flex: 1 0 auto;
        `,
        flowContent: css`
            .ant-layout-body {
                width: 80%;
                margin-left: 10%;
            }

            ${responsive.md} {
                .ant-layout-body {
                    width: 100%;
                    margin-left: 0;
                }
            }
        `,
        footer: css`
            text-align: center;
            flex-shrink: 0;
        `,
        flow: {
            display: "flex",
            justifyContent: "space-between",
            height: "55px",
        },
        logo: {
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            width: "220px",
            height: "55px",
        },
        darkColor: {
            backgroundColor: "#001529 !important"
        },
        layoutNormal: css`
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        `,
    };
});

/**
 * 面包屑项目类型
 */
export type BreadCrumbItem = {
    title: string; // 面包屑项标题
    path?: string; // 路径（可选）
    onClick?: () => void; // 点击回调函数
};

/**
 * 布局组件属性
 */
export type LayoutProps = {
    ref?: React.Ref<SinKingRef>; // 组件引用
    loading?: boolean; // 是否显示加载状态
    breadCrumb?: boolean; // 是否启用面包屑
    breadCrumbItems?: BreadCrumbItem[]; // 面包屑项目列表
    hideBreadCrumb?: boolean; // 是否隐藏面包屑
    menuCollapsedWidth?: number; // 菜单折叠时的宽度（默认60）
    menuUnCollapsedWidth?: number; // 菜单展开时的宽度（默认220）
    menus?: any; // 菜单列表数据
    menuClassNames?: any; // 菜单自定义样式类名
    pathname?: string; // 当前路由路径
    matchedRoutes?: any; // 匹配的路由列表（可以是 string[] 或完整的路由对象数组）
    onNavigate?: (path: string) => void; // 路由导航回调函数
    onMenuClick?: (item: any) => void; // 菜单项点击回调函数
    onMenuBtnClick?: (state: boolean) => void; // 菜单折叠/展开按钮点击回调函数
    footer?: any; // 页脚内容
    headerRight?: any; // Header 右侧内容
    headerLeft?: any; // Header 左侧内容
    headerHidden?: boolean; // 是否隐藏 Header
    headerFixed?: boolean; // Header 是否固定定位
    onLogoClick?: () => void; // Logo 点击回调函数
    collapsedLogo?: (isLight: boolean) => any; // 菜单折叠时的 Logo 渲染函数
    unCollapsedLogo?: (isLight: boolean) => any; // 菜单展开时的 Logo 渲染函数
    menuBottomBtnIcon?: any; // 菜单底部按钮图标
    menuBottomBtnText?: any; // 菜单底部按钮文字
    onMenuBottomBtnClick?: () => void; // 菜单底部按钮点击回调函数
    layout?: string; // 布局模式：'inline'（左右布局）| 'horizontal'（上下布局）
    flowLayout?: boolean; // 是否使用流式布局（内容居中）
    menuTheme?: string; // 菜单主题：'light' | 'dark'
    waterMark?: any; // 水印内容
    children?: React.ReactNode; // 子组件内容
};

/**
 * 布局组件引用接口
 * 用于父组件通过 ref 调用布局组件的方法
 */
export interface SinKingRef {
    collapsedMenu?: () => void; // 折叠菜单
    unCollapsedMenu?: () => void; // 展开菜单
    toggleCollapsedMenu?: () => void; // 切换菜单折叠/展开状态
}

const SinKing: React.FC<LayoutProps> = forwardRef<SinKingRef>((props: any, ref): any => {
    let {
        loading = false,
        breadCrumb = true,
        breadCrumbItems = [],
        hideBreadCrumb = false,
        menus,
        menuClassNames,
        pathname,
        matchedRoutes,
        onNavigate,
        onMenuClick,
        onMenuBtnClick,
        onLogoClick,
        collapsedLogo,
        unCollapsedLogo,
        headerRight,
        headerLeft,
        headerFixed,
        headerHidden = false,
        menuCollapsedWidth = 60,
        menuUnCollapsedWidth = 220,
        menuBottomBtnIcon = undefined,
        menuBottomBtnText = undefined,
        onMenuBottomBtnClick,
        layout = 'inline',
        flowLayout = false,
        menuTheme = "light",
        waterMark = undefined,
        children
    } = props;
    const systemTheme = useTheme();
    /*
     * 样式
     */
    const [collapsed, setCollapsed] = useState(false);
    const [open, setOpen] = useState(false);
    const {
        styles: {
            container,
            sider,
            inlineContent,
            sticky,
            header,
            horizontalContent,
            footer,
            body,
            drawMenu,
            menuBtn,
            flow,
            logo,
            darkColor,
            flowContent,
            layoutNormal
        },
        cx
    } = useLayoutStyles();
    const {mobile, md} = useResponsive();
    const menuBtnOnClick = () => {
        let status: boolean;
        if ((layout === 'inline' && mobile) || (layout === 'horizontal' && !md)) {
            if (collapsed) {
                setCollapsed(false);
            }
            status = !open
            setOpen(status);
        } else {
            status = !collapsed
            setCollapsed(status);
        }
        onMenuBtnClick?.(status);
    }

    /**
     * 方法挂载
     */
    useImperativeHandle(ref, () => ({
        collapsedMenu: () => {
            setCollapsed(true);
            setOpen(false);
        },
        unCollapsedMenu: () => {
            setCollapsed(false);
            setOpen(false);
        },
        toggleCollapsedMenu: () => {
            const status = !collapsed;
            setCollapsed(status);
            setOpen(false);
            onMenuBtnClick?.(status);
        }
    }));

    /**
     * 获取菜单主题颜色
     */
    const getColor = () => {
        const mode = systemTheme?.isDarkMode ? "light" : (menuTheme === "dark" ? menuTheme : "light");
        return !systemTheme?.isDarkMode && mode === "dark" ? ' ' + darkColor : '';
    }

    /**
     * 获取水印字体
     */
    const getWaterMaskFont = () => {
        return {
            color: systemTheme?.isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.07)"
        };
    }

    /**
     * 获取菜单
     * @param mode 布局模式
     */
    const getSider = (mode: string) => {
        const layoutMode = mode === "horizontal" ? mode : "inline";
        const theme = menuTheme === "dark" ? menuTheme : "light";
        // 转换 matchedRoutes 为 string[] 格式（如果不是的话）
        const routePaths = Array.isArray(matchedRoutes)
            ? (typeof matchedRoutes[0] === 'string'
                ? matchedRoutes
                : matchedRoutes.map((route: any) => route?.pathname || route))
            : [];

        return <Sider classNames={menuClassNames}
                      layout={layoutMode}
                      theme={theme}
                      collapsed={collapsed}
                      pathname={pathname}
                      matchedRoutes={routePaths}
                      onNavigate={onNavigate}
                      onLogoClick={onLogoClick}
                      collapsedLogo={collapsedLogo}
                      unCollapsedLogo={unCollapsedLogo}
                      menuBottomBtnIcon={menuBottomBtnIcon}
                      menuBottomBtnText={menuBottomBtnText}
                      onMenuBottomBtnClick={onMenuBottomBtnClick}
                      menus={menus}
                      onMenuClick={(item) => {
                          setOpen(false);
                          onMenuClick?.(item);
                      }}/>;
    }

    /**
     * 获取内容
     */
    const getOutlet = () => {
        return <Watermark gap={[200, 200]} font={getWaterMaskFont()} content={waterMark}>
            {children}
        </Watermark>;
    }

    /**
     * 移动端抽屉
     */
    const drawer = <Drawer placement="left" closable={false} open={open} size={menuUnCollapsedWidth}
                           classNames={{body: drawMenu}}
                           onClose={() => {
                               setOpen(false)
                           }}>
        {getSider("inline")}
    </Drawer>;

    /**
     * 左右模式
     */
    const LayoutNormal = <Layout className={container}>
        {mobile && drawer}
        <Layout.Sider className={sider} trigger={null} collapsible collapsed={collapsed}
                      width={menuUnCollapsedWidth} collapsedWidth={menuCollapsedWidth}
                      hidden={mobile}>
            {getSider(layout)}
        </Layout.Sider>
        <Layout className={body}>
            {!headerHidden && <Layout.Header className={cx(header, headerFixed && sticky)}>
                <Header left={<div><Button type="text" size={"large"}
                                           icon={collapsed ? <MenuUnfoldOutlined/> : <MenuFoldOutlined/>}
                                           onClick={menuBtnOnClick} className={menuBtn}/>{headerLeft}</div>}
                        right={headerRight}/>
            </Layout.Header>}
            <Layout.Content className={cx(inlineContent, flowLayout && flowContent)}>
                <BreadCrumb
                    enabled={breadCrumb}
                    items={breadCrumbItems}
                    hideBreadCrumb={hideBreadCrumb}
                />
                {getOutlet()}
            </Layout.Content>
            {props?.footer && <Layout.Footer className={footer}>
                <Footer> {props?.footer}</Footer>
            </Layout.Footer>}
        </Layout>
    </Layout>;

    /**
     * 上下模式
     */
    const LayoutFlow = <Layout className={layoutNormal}>
        <Layout.Header className={cx(header, headerFixed && sticky)}>
            {!md && <Header left={<div>
                <Button type="text" size={"large"} icon={collapsed ? <MenuUnfoldOutlined/> : <MenuFoldOutlined/>}
                        onClick={menuBtnOnClick} className={menuBtn}/>
                {headerLeft}
            </div>} right={headerRight}/>}
            {(!md && drawer) ||
                <div className={cx(flow, getColor())}>
                    <div className={logo}>
                        {unCollapsedLogo?.(!systemTheme?.isDarkMode)}
                    </div>
                    {getSider(layout)}
                    <div>{headerRight}</div>
                </div>
            }
        </Layout.Header>
        <Layout.Content className={cx(horizontalContent, flowLayout && flowContent)}>
            <BreadCrumb
                enabled={breadCrumb}
                items={breadCrumbItems}
                hideBreadCrumb={hideBreadCrumb}
            />
            {getOutlet()}
        </Layout.Content>
        {props?.footer && <Layout.Footer className={footer}>
            <Footer> {props?.footer}</Footer>
        </Layout.Footer>}
    </Layout>;

    return (
        <App>
            {(loading && <Loading/>) || (layout !== "horizontal" ? LayoutNormal : LayoutFlow)}
        </App>
    );
});
export default SinKing;