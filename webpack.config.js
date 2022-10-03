module.exports = {
    resolve: {
        extensions: [".ts", ".tsx", ".js", "jsx", ".json", ".csv"]
    },
    module: {
        rules: [
            {
                test: /\.csv$/,
                use: [
                    {
                        loader: 'file-loader',
                    },
                ],
            },
        ],
    },
};