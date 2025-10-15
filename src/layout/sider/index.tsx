import React, {useEffect, useState, useMemo, useCallback} from 'react';
import {ConfigProvider, Menu, Layout} from 'antd';
import {createStyles, useResponsive, useTheme} from "antd-style";
import {Icon} from "../../icon";

const useStyles = createStyles(({token, isDarkMode}): any => {
    return {
        left: {
            position: "relative",
            background: token?.colorBgContainer,
            height: "100%",
            display: "flex",
            flexDirection: "column",
        },
        content: {
            flex: 1,
            overflowY: "auto"
        },
        menu: {
            zIndex: 1,
            overflow: "auto",
            overflowX: "hidden",
            borderRight: "none !important",
            fontWeight: "600",
            userSelect: "none",
            ":focus-visible": {
                outline: "none !important"
            },
            "::-webkit-scrollbar": {
                width: 0
            },
            ".ant-menu-item-selected::after": {
                borderRadius: (token?.borderRadius || 0) > 3 ? `${token.borderRadius}px 0 0 ${token.borderRadius}px` : "0",
                borderRightWidth: "4px !important",
                ...(token?.borderRadius > 3 && {
                    right: "5px !important",
                    top: "19% !important",
                    height: "60% !important"
                })
            },
            ".ant-menu-item,.ant-menu-submenu-title": {
                transition: "border-color 0.3s,background 0.3s !important"
            },
        },
        menuTop: {
            zIndex: 2,
            userSelect: "none",
            height: "100px",
            lineHeight: "100px !important",
            width: "100%",
            padding: "10px !important",
            overflow: "hidden",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: token?.colorBgContainer + " !important",
        },
        menuBottom: {
            background: token?.colorBgContainer,
            userSelect: "none",
            padding: "0px !important",
            borderRadius: "0px",
            height: "50px",
            lineHeight: "50px !important",
            borderTop: "0.5px solid " + token?.colorBorder + " !important",
            borderBottom: "0.5px solid " + token?.colorBorder + " !important",
            fontWeight: "bolder",
            fontSize: 14,
            color: isDarkMode ? "rgb(255,255,255,0.65)" : "rgba(122,122,122)",
            cursor: "pointer",
            overflow: "hidden",
            width: "100%",
            zIndex: 2,
            transition: "background 0.3s !important",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        },
        logoClose: {
            margin: "0px -10px",
        },
        menu2: {
            fontWeight: "bolder",
            userSelect: "none",
            fontSize: "13px",
            flex: "auto",
            height: "55px",
            borderBottom: "none !important",
        },
        darkColor: {
            background: "#001529 !important",
            backgroundColor: "#001529 !important",
        },
        darkBorderTop: {
            borderTop: '0.5px solid #202020 !important',
            color: "white"
        }
    };
});

/**
 * 侧边栏菜单组件属性
 */
export type SiderProps = {
    collapsed?: boolean; // 菜单是否折叠
    menus?: any; // 菜单列表数据
    classNames?: any; // 菜单自定义样式类名
    pathname?: string; // 当前路由路径
    matchedRoutes?: string[]; // 匹配的路由路径列表
    onNavigate?: (path: string) => void; // 路由导航回调函数
    onMenuClick?: (item: any) => void; // 菜单项点击回调函数
    onLogoClick?: () => void; // Logo 点击回调函数
    collapsedLogo?: (isLight: boolean | undefined) => any; // 菜单折叠时的 Logo 渲染函数
    unCollapsedLogo?: (isLight: boolean | undefined) => any; // 菜单展开时的 Logo 渲染函数
    menuBottomBtnIcon?: string; // 菜单底部按钮图标
    menuBottomBtnText?: any; // 菜单底部按钮文字
    onMenuBottomBtnClick?: () => void; // 菜单底部按钮点击回调函数
    layout?: string; // 布局模式：'inline' | 'horizontal'
    theme?: string; // 菜单主题：'light' | 'dark'
};

const Sider: React.FC<SiderProps> = React.memo((props) => {
    const {
        collapsed,
        pathname,
        matchedRoutes = [],
        onNavigate,
        onMenuClick,
        menus,
        onLogoClick,
        collapsedLogo,
        unCollapsedLogo,
        menuBottomBtnIcon = null,
        menuBottomBtnText = null,
        onMenuBottomBtnClick,
        classNames,
        layout = "inline",
        theme = "light"
    } = props;
    const {mobile} = useResponsive();
    const token = useTheme();
    const {styles: {left, content, menu, menuTop, menuBottom, menu2, darkColor, darkBorderTop}, cx} = useStyles();
    const [selectedKeys, setSelectedKeys] = useState<any>([]);
    const [stateOpenKeys, setStateOpenKeys] = useState<any>([]);

    useEffect(() => {
        if (pathname) {
            setSelectedKeys([pathname]);
            setStateOpenKeys(matchedRoutes);
        }
    }, [pathname, matchedRoutes]);

    /**
     * 只展开一个子集
     */
    const levelKeys = useMemo(() => {
        const key: Record<string, number> = {};
        const func = (items2: any, level = 1) => {
            items2.forEach((item: any) => {
                if (item?.key) {
                    key[item.key] = level;
                }
                if (item?.children) {
                    return func(item.children, level + 1);
                }
            });
        };
        func(menus);
        return key;
    }, [menus]);

    const onOpenChange = useCallback((openKeys: any[]) => {
        const currentOpenKey = openKeys.find((key) => stateOpenKeys.indexOf(key) === -1);
        if (currentOpenKey !== undefined) {
            const repeatIndex = openKeys.filter((key) => key !== currentOpenKey).findIndex((key) => levelKeys[key] === levelKeys[currentOpenKey]);
            setStateOpenKeys(
                openKeys.filter((_, index) => index !== repeatIndex).filter((key) => levelKeys[key] <= levelKeys[currentOpenKey]),
            );
        } else {
            setStateOpenKeys(openKeys);
        }
    }, [stateOpenKeys, levelKeys]);

    /**
     * 获取菜单主题
     */
    const menuTheme = useMemo(() => {
        if (token?.isDarkMode) return "light";
        return theme === "dark" ? theme : "light";
    }, [token?.isDarkMode, theme]);

    const getColor = useMemo(() => {
        return !token?.isDarkMode && menuTheme === "dark" ? ' ' + darkColor : '';
    }, [token?.isDarkMode, menuTheme, darkColor]);

    const getBorderColor = useMemo(() => {
        return !token?.isDarkMode && menuTheme === "dark" ? ' ' + darkBorderTop : '';
    }, [token?.isDarkMode, menuTheme, darkBorderTop]);
    const menuConfig = useMemo(() => ({
        components: {
            Menu: {
                itemSelectedColor: token?.colorPrimaryText || "",
                itemColor: token?.colorTextSecondary || "",
                itemHoverColor: token?.colorTextSecondary || "",
                fontSize: 13,
                itemMarginBlock: 0,
                itemMarginInline: 0,
                itemBorderRadius: 0,
                subMenuItemBorderRadius: 0,
                activeBarWidth: 4,
                itemHeight: 45,
                subMenuItemBg: "rgba(255, 255, 255, 0)",
            }
        }
    }), [token?.colorPrimaryText, token?.colorTextSecondary]);

    const handleMenuClick = useCallback((item: any) => {
        if (onNavigate) {
            onNavigate(item?.key);
        }
        setSelectedKeys([item?.key]);
        onMenuClick?.(item);
    }, [onNavigate, onMenuClick]);

    const handleLogoClick = useCallback(() => {
        onLogoClick?.();
    }, [onLogoClick]);

    return (
        <>
            {layout === "inline" ? (
                <Layout className={cx(left, getColor)}>
                    <Layout.Header className={cx(menuTop, getColor)} onClick={handleLogoClick}>
                        {(mobile || (!mobile && !collapsed)) && unCollapsedLogo?.(!token?.isDarkMode)}
                        {!mobile && collapsed && collapsedLogo?.(token?.isDarkMode)}
                    </Layout.Header>
                    <Layout.Content className={cx(content, getColor)}>
                        <ConfigProvider theme={menuConfig}>
                            <Menu
                                selectedKeys={selectedKeys}
                                theme={menuTheme}
                                mode="inline"
                                items={menus}
                                className={cx(menu, classNames)}
                                openKeys={!collapsed ? stateOpenKeys : undefined}
                                onOpenChange={onOpenChange}
                                onClick={handleMenuClick}
                            />
                        </ConfigProvider>
                    </Layout.Content>
                    {(menuBottomBtnIcon || menuBottomBtnText) && (
                        <Layout.Footer className={cx(menuBottom, getColor, getBorderColor)}
                                       onClick={onMenuBottomBtnClick}>
                            {menuBottomBtnIcon && (typeof menuBottomBtnIcon === "string" ?
                                <Icon type={menuBottomBtnIcon}/> : menuBottomBtnIcon)}
                            {(mobile || (!mobile && !collapsed)) && menuBottomBtnText}
                        </Layout.Footer>
                    )}
                </Layout>
            ) : (
                <ConfigProvider theme={menuConfig}>
                    <Menu
                        theme={menuTheme}
                        mode="horizontal"
                        selectedKeys={selectedKeys}
                        items={menus}
                        className={cx(menu2, classNames)}
                        onClick={handleMenuClick}
                    />
                </ConfigProvider>
            )}
        </>
    );
});

export default Sider;