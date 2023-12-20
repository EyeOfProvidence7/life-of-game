const path = require("path");
module.exports = {
    context: __dirname,
    entry: "./src/main.ts",
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "dist"),
        publicPath: "/dist/"
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: "ts-loader"
            },
            {
                test: /\.wgsl$/,
                exclude: /node_modules/,
                use: 'raw-loader',
            }
        ]
    },

    resolve: {
        extensions: [".ts"]
    },
    
    devtool: 'inline-source-map', 
}