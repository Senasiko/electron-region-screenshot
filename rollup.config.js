const typescript = require('rollup-plugin-typescript2');
const copy = require('rollup-plugin-copy');
const { terser } = require("rollup-plugin-terser");

const plugins = [
  typescript({
    objectHashIgnoreUnknownHack: true
  }),
  terser(),
];

const external = [
  'electron',
  'path',
  'url',
  'child_process',
]

module.exports = [
  {
    input: 'src/index.ts',
    external,
    output: {
      file: 'dist/index.js',
      format: 'cjs',
    },
    plugins
  },
  {
    input: 'src/mainProcess/index.ts',
    external,
    output: {
      file: 'dist/mainProcess.js',
      format: 'cjs',
    },
    plugins
  },
  {
    input: 'src/rendererProcess/index.ts',
    external,
    output: {
      file: 'dist/rendererProcess.js',
      format: 'cjs',
    },
    plugins: [
      ...plugins,
      copy({
        targets: [
          { src: ['src/capturer/**/*', '!**/*.ts'], dest: 'dist' }
        ]
      })
    ]
  },
  {
    input: 'src/screenshot/screen.ts',
    external,
    output: {
      file: 'dist/screenshot/screen.js',
      format: 'cjs',
    },
    watch: {
      include: ['src/screenshot/**/*']
    },
    plugins: [
      ...plugins,
      copy({
        targets: [
          { src: ['src/screenshot/**/*', '!**/*.ts'], dest: 'dist/screenshot' }
        ]
      })
    ]
  },
]
