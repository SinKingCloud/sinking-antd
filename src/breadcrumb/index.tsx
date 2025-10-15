import React from "react";
import {Breadcrumb} from "antd";
import {createStyles} from "antd-style";

const useBreadCrumbStyles = createStyles(({token}) => {
    return {
        bread: {
            backgroundColor: token?.colorBgContainer,
            padding: "5px 15px 5px 15px",
            fontSize: "12px",
        },
        breadStyle: {
            color: "rgb(156, 156, 156)",
            cursor: "pointer"
        },
    };
});

/**
 * 面包屑项目类型
 */
export type BreadCrumbItem = {
    title: string; // 面包屑项标题
    path?: string; // 路径（可选，用于记录但不直接使用）
    onClick?: () => void; // 点击回调函数
};

/**
 * 面包屑组件属性
 */
export type BreadCrumbProps = {
    style?: React.CSSProperties; // 自定义样式
    className?: string; // 自定义样式类名
    enabled?: boolean; // 是否启用面包屑（默认 true）
    items?: BreadCrumbItem[]; // 面包屑项目列表（由外部传入）
    hideBreadCrumb?: boolean; // 是否隐藏面包屑（通常由路由配置决定）
};

/**
 * 面包屑组件
 * @param props
 * @constructor
 */
const BreadCrumb: React.FC<BreadCrumbProps> = React.memo((props) => {
    const {
        style,
        className,
        enabled = true,
        items = [],
        hideBreadCrumb = false
    } = props;

    const {styles: {bread, breadStyle}} = useBreadCrumbStyles();

    // 如果禁用、隐藏或没有数据，则不渲染
    if (!enabled || hideBreadCrumb || items.length === 0) {
        return null;
    }

    // 将传入的 items 转换为 Ant Design Breadcrumb 需要的格式
    const breadCrumbData = items.map(item => ({
        title: item.title,
        onClick: item.onClick,
        className: breadStyle,
    }));

    return (
        <Breadcrumb
            className={`${bread} ${className || ''}`}
            style={style}
            items={breadCrumbData}
        />
    );
});

export default BreadCrumb;