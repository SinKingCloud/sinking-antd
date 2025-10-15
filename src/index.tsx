// ============ Icon 组件及其相关导出 ============
import {
    Icon,
    IconFontProvider,
    setIconfontUrl,
    getIconfontUrl,
    getAntdIconNames,
    getIconfontIconNames,
    getAllIconNames
} from "./icon";
import type {IconFontProviderProps} from "./icon";

// ============ Breadcrumb 组件及其相关导出 ============
import Breadcrumb from "./breadcrumb";
import type {BreadCrumbItem, BreadCrumbProps} from "./breadcrumb";

// ============ Antd 组件及其相关导出 ============
import Antd, {Message, Notification, Modal} from "./antd";

// ============ Theme 组件及其相关导出 ============
import Theme, {useTheme} from "./theme";
import type {ThemeContextType, ThemeProps} from "./theme";

// ============ Animation 组件及其相关导出 ============
import Animation from "./animation";
import {Animate} from "./animation";
import type {AnimationProps} from "./animation";

// ============ Title 组件及其相关导出 ============
import Title from "./title";
import type {TitlePlacement, TitleSize, TitleProps} from "./title";

// ============ Layout 组件及其相关导出 ============
import Layout, {Body, Header, Footer, Sider} from "./layout";
import type {LayoutProps, SinKingRef} from "./layout/sinking";

// ============ ProTable 组件及其相关导出 ============
import ProTable from "./pro-table";
import type {ProColumns, ProTableSearch, ProTableProps, ProTableRef} from "./pro-table";

// ============ ProModal 组件及其相关导出 ============
import ProModal from "./pro-modal";
import type {ProModalProps, ProModalRef} from "./pro-modal";

// ============ 统一导出所有组件和工具 ============
export {
    // Icon 相关
    Icon,
    IconFontProvider,
    setIconfontUrl,
    getIconfontUrl,
    getAntdIconNames,
    getIconfontIconNames,
    getAllIconNames,
    
    // Breadcrumb 相关
    Breadcrumb,
    
    // Antd 相关
    Antd,
    Message,
    Notification,
    Modal,
    
    // Theme 相关
    Theme,
    useTheme,
    
    // Animation 相关
    Animation,
    Animate,
    
    // Title 相关
    Title,
    
    // Layout 相关
    Layout,
    Body,
    Header,
    Footer,
    Sider,
    
    // ProTable 相关
    ProTable,
    
    // ProModal 相关
    ProModal,
};

// ============ 导出所有类型 ============
export type {
    // Icon 类型
    IconFontProviderProps,
    
    // Breadcrumb 类型
    BreadCrumbItem,
    BreadCrumbProps,
    
    // Theme 类型
    ThemeContextType,
    ThemeProps,
    
    // Animation 类型
    AnimationProps,
    
    // Title 类型
    TitlePlacement,
    TitleSize,
    TitleProps,
    
    // Layout 类型
    LayoutProps,
    SinKingRef,
    
    // ProTable 类型
    ProColumns,
    ProTableSearch,
    ProTableProps,
    ProTableRef,
    
    // ProModal 类型
    ProModalProps,
    ProModalRef,
};
