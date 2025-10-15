// noinspection TypeScriptValidateTypes,HtmlUnknownAttribute,JSUnusedGlobalSymbols

/**
 * Icon 组件 - 支持 Ant Design 图标和 iconfont 图标
 * 
 * 使用方式：
 * 
 * 1. 全局配置（推荐，应用启动时设置一次）
 *    ```tsx
 *    import { setIconfontUrl } from '@/components/icon';
 *    
 *    // 设置单个 iconfont 地址
 *    setIconfontUrl('//at.alicdn.com/t/c/font_xxx.js');
 *    
 *    // 设置多个 iconfont 地址（支持多个图标库）
 *    setIconfontUrl([
 *      '//at.alicdn.com/t/c/font_xxx1.js',
 *      '//at.alicdn.com/t/c/font_xxx2.js'
 *    ]);
 *    ```
 * 
 * 2. 使用 Provider 局部配置（适用于特定区域需要不同图标库）
 *    ```tsx
 *    import { Icon, IconFontProvider } from '@/components/icon';
 *    
 *    <IconFontProvider iconfontUrl="//at.alicdn.com/t/c/font_xxx.js">
 *      <Icon type="icon-xxx" />
 *    </IconFontProvider>
 *    ```
 * 
 * 3. 直接在组件上配置（优先级最高，适用于个别图标需要特殊处理）
 *    ```tsx
 *    import { Icon } from '@/components/icon';
 *    
 *    <Icon type="icon-xxx" iconfontUrl="//at.alicdn.com/t/c/font_xxx.js" />
 *    ```
 * 
 * 优先级：组件 props > IconFontProvider > 全局配置 > 默认值
 */

import React, {createContext, useContext, useMemo} from 'react';
import {createFromIconfontCN} from '@ant-design/icons';
import * as AntdIcons from '@ant-design/icons';
import {createStyles} from 'antd-style';

/**
 * 全局 iconfont 地址配置
 */
let globalIconfontUrl: string | string[] | undefined = undefined;

/**
 * 设置全局 iconfont 地址
 * @param url iconfont 脚本地址（单个或多个）
 */
export const setIconfontUrl = (url: string | string[]): void => {
    globalIconfontUrl = url;
    // 清除缓存，使新地址生效
    iconfontCache = null;
};

/**
 * 获取当前 iconfont 地址
 * @returns 当前配置的 iconfont 地址（未配置时返回 undefined）
 */
export const getIconfontUrl = (): string | string[] | undefined => {
    return globalIconfontUrl;
};

/**
 * IconFont 配置上下文
 */
interface IconFontContextType {
    iconfontUrl?: string | string[];
}

const IconFontContext = createContext<IconFontContextType>({});

/**
 * IconFont 配置 Provider 组件属性
 */
export interface IconFontProviderProps {
    iconfontUrl?: string | string[]; // iconfont 脚本地址（可以是单个地址或多个地址数组）
    children: React.ReactNode; // 子组件
}

/**
 * IconFont 配置 Provider 组件
 * 用于为子组件提供自定义的 iconfont 地址
 */
export const IconFontProvider: React.FC<IconFontProviderProps> = ({iconfontUrl, children}) => {
    return (
        <IconFontContext.Provider value={{iconfontUrl}}>
            {children}
        </IconFontContext.Provider>
    );
};

/**
 * 样式
 */
const useStyles: any = createStyles(() => ({
    iconWrapper: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
    }
}));

/**
 * Icon 组件属性
 */
interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
    type: string; // 图标类型（Antd 图标名 或 iconfont 图标名）
    iconfontUrl?: string | string[]; // 自定义 iconfont 地址（可选，优先级最高）
    ref?: any; // 组件引用
    className?: any; // 自定义样式类名
    style?: any; // 自定义样式
    onClick?: any; // 点击事件
}

/**
 * Icon 组件
 * 支持 Ant Design 图标和 iconfont 图标
 */
export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
    ({type, iconfontUrl, className, style, onClick, ...rest}, ref) => {
        const {styles, cx} = useStyles();
        const context = useContext(IconFontContext);
        
        // 优先级：props > context > 全局配置
        const currentIconfontUrl = iconfontUrl || context.iconfontUrl || globalIconfontUrl;
        
        // 使用 useMemo 缓存 iconfont 组件实例，避免重复创建
        const IconfontIcon = useMemo(() => {
            if (!currentIconfontUrl) {
                return null;
            }
            return createFromIconfontCN({
                scriptUrl: currentIconfontUrl,
            });
        }, [currentIconfontUrl]);
        
        // 优先渲染 Antd 图标
        const AntdIconComponent: any = (AntdIcons as any)[type];
        if (AntdIconComponent) {
            return (
                <AntdIconComponent ref={ref} className={cx(styles.iconWrapper, className)} style={style}
                                   onClick={onClick} {...rest}/>
            );
        }
        
        // 渲染 iconfont 图标
        if (type.startsWith('icon-')) {
            if (!IconfontIcon) {
                // 渲染占位符
                return (
                    <span ref={ref} className={cx(styles.iconWrapper, className)} style={style} onClick={onClick} {...rest}>
                        {type}
                    </span>
                );
            }
            return (
                <IconfontIcon type={type} ref={ref} className={cx(styles.iconWrapper, className)} style={style}
                              onClick={onClick} {...rest}/>
            );
        }
        
        // 兜底渲染文本
        return (
            <span ref={ref} className={cx(styles.iconWrapper, className)} style={style} onClick={onClick} {...rest}>
                {type}
            </span>
        );
    }
);

/**
 * 获取所有 Antd 图标名称
 */
export const getAntdIconNames = (): string[] => {
    return Object.keys(AntdIcons).filter(key => {
        return !key.startsWith('create') &&
            !key.startsWith('set') &&
            !key.startsWith('get') &&
            key !== 'default';
    });
};

/**
 * Iconfont 图标缓存
 */
let iconfontCache: string[] | null = null;

/**
 * 地址转换（规范化 URL）
 * @param url 原始 URL
 * @returns 规范化后的 URL
 */
const normalizeUrl = (url: string): string => {
    if (url.startsWith('//')) {
        return `https:${url}`;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // 相对路径直接返回（以 / 开头）
    return url.startsWith('/') ? url : `/${url}`;
};

/**
 * 获取所有 iconfont 图标名称
 * @param url 可选的 iconfont 地址（不传则使用全局配置）
 * @returns iconfont 图标名称数组
 */
export const getIconfontIconNames = async (url?: string | string[]): Promise<string[]> => {
    const targetUrl = url || globalIconfontUrl;
    
    // 如果未配置 iconfont 地址，返回空数组
    if (!targetUrl) {
        return [];
    }
    
    // 如果传入了新的 URL，清除缓存
    if (url && iconfontCache) {
        iconfontCache = null;
    }
    
    if (iconfontCache) return iconfontCache;
    
    try {
        // 支持多个 iconfont 地址
        const urls = Array.isArray(targetUrl) ? targetUrl : [targetUrl];
        const iconSets = await Promise.all(
            urls.map(async (scriptUrl) => {
                try {
                    const response = await fetch(normalizeUrl(scriptUrl));
                    const scriptText = await response.text();
                    return [...scriptText.matchAll(/id="(icon-[^"]+)"/g)].map(m => m[1]);
                } catch (_) {
                    return [];
                }
            })
        );
        
        // 合并所有图标名称并去重
        const allIcons = [...new Set(iconSets.flat())];
        iconfontCache = allIcons;
        return allIcons;
    } catch (_) {
        return [];
    }
};

/**
 * 获取所有图标名称（Antd + Iconfont）
 * @param iconfontUrl 可选的 iconfont 地址（不传则使用全局配置）
 * @returns 所有图标名称数组
 */
export const getAllIconNames = async (iconfontUrl?: string | string[]): Promise<string[]> => {
    const [antdIcons, iconfontIcons] = await Promise.all([
        Promise.resolve(getAntdIconNames()),
        getIconfontIconNames(iconfontUrl)
    ]);
    return [...antdIcons, ...iconfontIcons];
};