import React from 'react';
import {createStyles} from "antd-style";
import {useTheme} from "../theme";

/**
 * 标题条位置类型
 */
export type TitlePlacement = 'left' | 'right';

/**
 * 标题条大小类型
 */
export type TitleSize = 'small' | 'normal' | 'larger';

/**
 * 标题条组件属性
 */
export type TitleProps = {
    children?: any; // 子内容（标题文本）
    placement?: TitlePlacement; // 标题条位置：'left' | 'right'（默认 'left'）
    size?: TitleSize; // 标题条大小：'small' | 'normal' | 'larger'（默认 'normal'）
    open?: boolean; // 是否显示标题条（默认 true）
    width?: number; // 标题条宽度（默认 5）
    height?: number; // 标题条高度（默认根据 size 自动计算）
    radius?: number; // 标题条圆角（默认 -1，跟随主题圆角设置）
    space?: number; // 标题条与文本的间距（默认 7）
};

const Title: React.FC<TitleProps> = ({...props}) => {
    const {
        placement = "left",
        size = "normal" as TitleSize,
        open = true,
        width = 5,
        height = 0,
        radius = -1,
        space = 7,
    } = props;

    const theme = useTheme();

    const getHeight = (h: number, s: TitleSize) => {
        if (h > 0) {
            return h;
        }
        const sizeMap: Record<TitleSize, number> = {
            small: 15,
            normal: 20,
            larger: 25
        }
        return sizeMap[s] || 20;
    }

    const useStyles = createStyles(({token}): any => {
        const isCompact = theme?.isCompactTheme() || false;
        const barRadius = radius < 0 ? (token?.borderRadius > 3 ? token?.borderRadius : 0) : radius;
        const barHeight = isCompact ? getHeight(height, size) - 5 : (barRadius > 0 ? getHeight(height, size) : getHeight(height, size) - 3);
        const barWidth = isCompact || (!isCompact && barRadius <= 0) ? width - 1 : width;
        return {
            center: {
                display: "flex",
                alignItems: "center",
                justifyContent: "start"
            },
            leftBar: {
                width: barWidth,
                height: barHeight,
                borderTopRightRadius: barRadius,
                borderBottomRightRadius: barRadius,
                marginRight: space,
                backgroundColor: token?.colorPrimary,
            },
            rightBar: {
                width: barWidth,
                height: barHeight,
                borderTopLeftRadius: barRadius,
                borderBottomLeftRadius: barRadius,
                marginLeft: space,
                backgroundColor: token?.colorPrimary,
            }
        };
    });

    const {styles: {center, leftBar, rightBar}} = useStyles();

    const left = <div className={center}>
        {open && <span className={leftBar}/>}
        {props?.children}
    </div>;

    const right = <div className={center}>
        {props?.children}
        {open && <span className={rightBar}/>}
    </div>;

    return (
        <>
            {placement == 'left' && left}
            {placement == 'right' && right}
        </>
    );
};

export default Title;