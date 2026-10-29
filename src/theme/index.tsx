import React, {createContext, useCallback, useContext, useMemo, useState, ReactNode} from 'react';
import {StyleProvider, ThemeProvider, ThemeMode} from 'antd-style';
import {theme} from 'antd';
import Antd from "../antd";

// 禁用也标记为已处理，避免内层 Layout / Body 再建立样式缓存。
const StyleBoundaryContext = createContext(false);

export type StyleBoundaryProps = {
    enabled?: boolean;
    children?: React.ReactNode;
};

export const StyleBoundary: React.FC<StyleBoundaryProps> = ({enabled = true, children}) => {
    const inherited = useContext(StyleBoundaryContext);
    if (inherited) return children;

    return <StyleBoundaryContext.Provider value={true}>
        {enabled ? <StyleProvider prefix="sinking-antd" speedy>{children}</StyleProvider> : children}
    </StyleBoundaryContext.Provider>;
};


// 获取风格
const getDefaultTheme = (color: string, radius: number): any => {
    return {
        token: {
            colorPrimary: color,
            colorInfo: color,
            borderRadius: radius
        },
    }
}

// 获取紧凑风格
const getCompactTheme = (color: string, radius: number): any => {
    let temp = getDefaultTheme(color, radius);
    temp.algorithm = [theme.compactAlgorithm];
    return temp;
}

/**
 * 获取主题模式
 */
const getMode = (): ThemeMode => {
    const mode = typeof localStorage === "undefined" ? null : localStorage.getItem("theme");
    if (mode == "light" || mode == "dark") {
        return mode as ThemeMode;
    }
    return "auto" as ThemeMode;
}

/**
 * 设置主题模式到 localStorage
 * @param mode 模式
 */
const setModeToStorage = (mode: string): void => {
    if (typeof localStorage !== "undefined") localStorage.setItem("theme", mode);
}

/**
 * 主题上下文类型
 * 提供主题管理的所有方法和状态
 */
export interface ThemeContextType {
    themes: any; // 当前主题配置对象
    setColor: (color: string) => void; // 设置主题颜色
    setRadius: (radius: number) => void; // 设置主题圆角
    setThemes: (theme: any) => void; // 设置完整主题配置
    setDefaultTheme: () => void; // 设置默认主题（非紧凑）
    setCompactTheme: () => void; // 设置紧凑主题
    appearance: any; // 当前外观（亮色/暗色）
    setAppearance: (appearance: any) => void; // 设置外观
    mode: ThemeMode; // 当前主题模式
    getModeName: (mode: ThemeMode) => string; // 获取模式名称
    lightMode: ThemeMode; // 亮色模式常量
    darkMode: ThemeMode; // 暗色模式常量
    autoMode: ThemeMode; // 自动模式常量
    setLightMode: () => void; // 切换到亮色模式
    setDarkMode: () => void; // 切换到暗色模式
    setAutoMode: () => void; // 切换到跟随系统模式
    isLightMode: () => boolean; // 判断是否为亮色模式
    isDarkMode: () => boolean; // 判断是否为暗色模式
    isAutoMode: () => boolean; // 判断是否为跟随系统模式
    isLightTheme: () => boolean; // 判断当前是否为亮色主题
    isDarkTheme: () => boolean; // 判断当前是否为暗色主题
    isCompactTheme: () => boolean; // 判断当前是否为紧凑主题
    toggle: () => void; // 切换主题模式（自动 -> 亮色 -> 暗色 -> 自动）
}

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 导出 useTheme hook
export const useTheme = (): ThemeContextType | undefined => {
    const context = useContext(ThemeContext);
    if (!context) {
        return undefined;
    }
    return context;
};

/**
 * 主题组件属性
 */
export type ThemeProps = {
    styleProvider?: boolean; // 默认共享极速样式；外部原生 StyleProvider 配置时设为 false
    theme?: any; // 自定义主题配置对象（可选，覆盖默认主题）
    mode?: ThemeMode; // 自定义主题模式（可选，覆盖默认模式）
    appearance?: any; // 自定义外观（可选，控制亮色/暗色）
    onAppearanceChange?: (appearance: any) => void; // 外观变化回调函数（可选）
    children?: ReactNode; // 子组件
};

// 主题 Provider 组件（合并后的统一组件）
const Theme: React.FC<ThemeProps> = ({
                                         children,
                                         styleProvider,
                                         theme: customTheme,
                                         mode: customMode,
                                         appearance: customAppearance,
                                         onAppearanceChange
                                     }) => {
    const existingContext = useContext(ThemeContext);
    if (existingContext && !customTheme && !customMode && !customAppearance && !onAppearanceChange) {
        return children;
    }
    return <StyleBoundary enabled={styleProvider}>
        <ThemeProviderInner
            theme={customTheme}
            mode={customMode}
            appearance={customAppearance}
            onAppearanceChange={onAppearanceChange}>
            {children}
        </ThemeProviderInner>
    </StyleBoundary>;
};

const ThemeProviderInner: React.FC<ThemeProps> = ({
                                                      children,
                                                      theme: customTheme,
                                                      mode: customMode,
                                                      appearance: customAppearance,
                                                      onAppearanceChange
                                                  }) => {
    const [themes, setThemes] = useState<any>(() => customTheme || getDefaultTheme("#1890ff", 6));
    const [mode, setMode2] = useState<ThemeMode>(() => customMode || getMode());
    const [appearance, setAppearance] = useState<any>(customAppearance !== undefined ? customAppearance : null);

    const lightMode: ThemeMode = "light";
    const darkMode: ThemeMode = "dark";
    const autoMode: ThemeMode = "auto";

    const setPresetTheme = useCallback((compact: boolean) => {
        setThemes((current: any) => {
            const next = (compact ? getCompactTheme : getDefaultTheme)(current?.token?.colorPrimary, current?.token?.borderRadius);
            // 相同预设复用引用，额外配置仍会被重置。
            if (!current || Object.keys(current).length !== Object.keys(next).length) return next;
            const currentToken = current.token;
            const nextToken = next.token;
            if (!currentToken || Object.keys(currentToken).length !== Object.keys(nextToken).length ||
                Object.keys(nextToken).some((key) => !Object.prototype.hasOwnProperty.call(currentToken, key) ||
                    !Object.is(currentToken[key], nextToken[key]))) return next;
            const currentAlgorithm = current.algorithm;
            const nextAlgorithm = next.algorithm;
            return currentAlgorithm === nextAlgorithm || (Array.isArray(currentAlgorithm) && Array.isArray(nextAlgorithm) &&
                currentAlgorithm.length === nextAlgorithm.length &&
                currentAlgorithm.every((algorithm, index) => algorithm === nextAlgorithm[index])) ? current : next;
        });
    }, []);

    /**
     * 设置默认主题
     */
    const setDefaultTheme = useCallback(() => setPresetTheme(false), [setPresetTheme]);

    /**
     * 设置紧凑主题
     */
    const setCompactTheme = useCallback(() => setPresetTheme(true), [setPresetTheme]);

    /**
     * 设置主题颜色
     */
    const setColor = useCallback((color: string) => {
        setThemes((current: any) => current?.token?.colorPrimary === color && current?.token?.colorInfo === color ? current : ({
            ...current,
            token: {...current.token, colorPrimary: color, colorInfo: color},
        }));
    }, []);

    /**
     * 设置主题圆角
     */
    const setRadius = useCallback((radius: number) => {
        setThemes((current: any) => Object.is(current?.token?.borderRadius, radius) ? current : ({
            ...current,
            token: {...current.token, borderRadius: radius},
        }));
    }, []);

    /**
     * 获取模式名称
     */
    const getModeName = useCallback((modeValue: string) => {
        if (modeValue == lightMode) {
            return "亮色风格";
        }
        if (modeValue == darkMode) {
            return "暗色风格";
        }
        return "跟随系统";
    }, []);

    /**
     * 设置亮色模式
     */
    const setLightMode = useCallback(() => {
        setModeToStorage(lightMode);
        setMode2(lightMode)
        setAppearance(lightMode);
    }, []);

    /**
     * 设置暗色模式
     */
    const setDarkMode = useCallback(() => {
        setModeToStorage(darkMode);
        setMode2(darkMode);
        setAppearance(darkMode);
    }, []);

    /**
     * 设置跟随系统模式
     */
    const setAutoMode = useCallback(() => {
        setModeToStorage(autoMode);
        setMode2(autoMode);
        setAppearance(null);
    }, []);

    /**
     * 是否为亮色模式
     */
    const isLightMode = useCallback(() => {
        return mode == lightMode;
    }, [mode]);

    /**
     * 是否为暗色模式
     */
    const isDarkMode = useCallback(() => {
        return mode == darkMode;
    }, [mode]);

    /**
     * 是否为跟随系统模式
     */
    const isAutoMode = useCallback(() => {
        return mode == autoMode;
    }, [mode]);

    /**
     * 当前是否为亮色风格
     */
    const isLightTheme = useCallback(() => {
        return appearance == lightMode;
    }, [appearance]);

    /**
     * 当前是否为暗色风格
     */
    const isDarkTheme = useCallback(() => {
        return appearance == darkMode;
    }, [appearance]);

    /**
     * 当前是否为紧凑主题
     */
    const isCompactTheme = useCallback(() => {
        return themes?.algorithm && Array.isArray(themes.algorithm) && themes.algorithm.includes(theme.compactAlgorithm);
    }, [themes]);

    /**
     * 模式切换
     */
    const toggle = useCallback(() => {
        if (isAutoMode()) {
            setLightMode();
        } else if (isLightMode()) {
            setDarkMode();
        } else {
            setAutoMode();
        }
    }, [isAutoMode, isLightMode, setLightMode, setDarkMode, setAutoMode]);

    const value = useMemo<ThemeContextType>(() => ({
        themes,
        setColor,
        setRadius,
        setThemes,
        setDefaultTheme,
        setCompactTheme,
        appearance,
        setAppearance,
        mode,
        getModeName,
        lightMode,
        darkMode,
        autoMode,
        setLightMode,
        setDarkMode,
        setAutoMode,
        isLightMode,
        isDarkMode,
        isAutoMode,
        isLightTheme,
        isDarkTheme,
        isCompactTheme,
        toggle
    }), [themes, setColor, setRadius, setDefaultTheme, setCompactTheme, appearance, mode, getModeName,
        setLightMode, setDarkMode, setAutoMode, isLightMode, isDarkMode, isAutoMode, isLightTheme,
        isDarkTheme, isCompactTheme, toggle]);

    const handleAppearanceChange = useCallback((newAppearance: any) => {
        onAppearanceChange?.(newAppearance);
        setAppearance(newAppearance);
    }, [onAppearanceChange]);

    return (
        <ThemeContext.Provider value={value}>
            <ThemeProvider
                theme={themes}
                themeMode={mode}
                appearance={appearance}
                onAppearanceChange={handleAppearanceChange}>
                <Antd/>
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};

export default Theme;
