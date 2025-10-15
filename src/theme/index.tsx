import React, {createContext, useContext, useState, ReactNode} from 'react';
import {ThemeProvider, ThemeMode} from 'antd-style';
import {theme} from 'antd';
import Antd from "../antd";

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
    const mode = localStorage?.getItem("theme")
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
    localStorage?.setItem("theme", mode);
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
    theme?: any; // 自定义主题配置对象（可选，覆盖默认主题）
    mode?: ThemeMode; // 自定义主题模式（可选，覆盖默认模式）
    appearance?: any; // 自定义外观（可选，控制亮色/暗色）
    onAppearanceChange?: (appearance: any) => void; // 外观变化回调函数（可选）
    children?: ReactNode; // 子组件
};

// 主题 Provider 组件（合并后的统一组件）
const Theme: React.FC<ThemeProps> = ({
                                         children,
                                         theme: customTheme,
                                         mode: customMode,
                                         appearance: customAppearance,
                                         onAppearanceChange
                                     }) => {
    const existingContext = useContext(ThemeContext);
    if (existingContext && !customTheme && !customMode && !customAppearance && !onAppearanceChange) {
        return children;
    }
    return <ThemeProviderInner
        theme={customTheme}
        mode={customMode}
        appearance={customAppearance}
        onAppearanceChange={onAppearanceChange}>
        {children}
    </ThemeProviderInner>;
};

const ThemeProviderInner: React.FC<ThemeProps> = ({
                                                      children,
                                                      theme: customTheme,
                                                      mode: customMode,
                                                      appearance: customAppearance,
                                                      onAppearanceChange
                                                  }) => {
    const [themes, setThemes] = useState<any>(customTheme || getDefaultTheme("#1890ff", 6));
    const [mode, setMode2] = useState<ThemeMode>(customMode || getMode());
    const [appearance, setAppearance] = useState<any>(customAppearance !== undefined ? customAppearance : null);

    const lightMode: ThemeMode = "light";
    const darkMode: ThemeMode = "dark";
    const autoMode: ThemeMode = "auto";

    /**
     * 设置默认主题
     */
    const setDefaultTheme = () => {
        setThemes(getDefaultTheme(themes?.token?.colorPrimary, themes?.token?.borderRadius))
    }

    /**
     * 设置紧凑主题
     */
    const setCompactTheme = () => {
        setThemes(getCompactTheme(themes?.token?.colorPrimary, themes?.token?.borderRadius))
    }

    /**
     * 设置主题颜色
     */
    const setColor = (color: string) => {
        let temp = {...themes}
        temp.token.colorPrimary = color;
        temp.token.colorInfo = color;
        setThemes(temp);
    }

    /**
     * 设置主题圆角
     */
    const setRadius = (radius: number) => {
        let temp = {...themes}
        temp.token.borderRadius = radius;
        setThemes(temp);
    }

    /**
     * 获取模式名称
     */
    const getModeName = (modeValue: string) => {
        if (modeValue == lightMode) {
            return "亮色风格";
        }
        if (modeValue == darkMode) {
            return "暗色风格";
        }
        return "跟随系统";
    }

    /**
     * 设置亮色模式
     */
    const setLightMode = () => {
        setModeToStorage(lightMode);
        setMode2(lightMode)
        setAppearance(lightMode);
    }

    /**
     * 设置暗色模式
     */
    const setDarkMode = () => {
        setModeToStorage(darkMode);
        setMode2(darkMode);
        setAppearance(darkMode);
    }

    /**
     * 设置跟随系统模式
     */
    const setAutoMode = () => {
        setModeToStorage(autoMode);
        setMode2(autoMode);
        setAppearance(null);
    }

    /**
     * 是否为亮色模式
     */
    const isLightMode = () => {
        return mode == lightMode;
    }

    /**
     * 是否为暗色模式
     */
    const isDarkMode = () => {
        return mode == darkMode;
    }

    /**
     * 是否为跟随系统模式
     */
    const isAutoMode = () => {
        return mode == autoMode;
    }

    /**
     * 当前是否为亮色风格
     */
    const isLightTheme = () => {
        return appearance == lightMode;
    }

    /**
     * 当前是否为暗色风格
     */
    const isDarkTheme = () => {
        return appearance == darkMode;
    }

    /**
     * 当前是否为紧凑主题
     */
    const isCompactTheme = () => {
        return themes?.algorithm && Array.isArray(themes.algorithm) && themes.algorithm.includes(theme.compactAlgorithm);
    }

    /**
     * 模式切换
     */
    const toggle = () => {
        if (isAutoMode()) {
            setLightMode();
        } else if (isLightMode()) {
            setDarkMode();
        } else {
            setAutoMode();
        }
    }

    const value: ThemeContextType = {
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
    };

    return (
        <ThemeContext.Provider value={value}>
            <ThemeProvider
                theme={themes}
                themeMode={mode}
                appearance={appearance}
                onAppearanceChange={(newAppearance) => {
                    onAppearanceChange?.(newAppearance);
                    setAppearance(newAppearance);
                }}>
                <Antd/>
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};

export default Theme;
