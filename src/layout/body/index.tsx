import React from "react";
import {Layout} from "antd";
import {createStyles, css} from "antd-style";
import {Spin, Space, App} from "antd";
import Animation from "../../animation";
import {Animate} from "../../animation";
import {StyleBoundary} from "../../theme";

const useStyles = createStyles({
    body: css`
            padding: 10px;
        `,
    load: css({
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "80vh",
    }),
    gutter: css({
        display: "flex"
    }),
});

export type BodyProps = {
    styleProvider?: boolean; // 默认共享极速样式；外部原生 StyleProvider 配置时设为 false
    loading?: boolean;//是否加载状态
    space?: boolean;//是否开启间距
    animation?: boolean;//动画
    style?: any;//样式
    className?: any;//样式名
    children?: any;//子内容
};
/**
 * 页面主体部分
 * @param props
 * @constructor
 */
const BodyContent: React.FC<BodyProps> = React.memo((props) => {
    const {
        children,
        loading,
        style,
        className,
        space = true,
        animation = true,
    } = props;
    const {styles: {body, load, gutter}, cx} = useStyles();

    /**
     * 页面容器
     */
    return <App>
        {loading ? (
            <Spin spinning={true} size="large" className={load}></Spin>
        ) : (
            <Layout style={style}>
                <div className={cx("ant-layout-body", className || body)}>
                    <Animation animate={animation ? Animate.FadeUp : Animate.None}>
                        {space ? (
                            <Space orientation="vertical" size="middle" className={gutter}>
                                {children}
                            </Space>
                        ) : children}
                    </Animation>
                </div>
            </Layout>
        )}
    </App>;
});

const Body: React.FC<BodyProps> = React.memo((props) => {
    return <StyleBoundary enabled={props.styleProvider}>
        <BodyContent {...props}/>
    </StyleBoundary>;
});

export default Body;
