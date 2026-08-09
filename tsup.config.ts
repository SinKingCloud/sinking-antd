import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['cjs', 'esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'antd', '@ant-design/icons', 'antd-style'],
  treeshake: true,
  minify: false,
  outDir: 'dist',
});

