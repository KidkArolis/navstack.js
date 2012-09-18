var config = module.exports;

config["Tests"] = {
    env: "browser",
    sources: ["navstack.js", "test/test-helper.js"],
    tests: ["test/**/*-test.js"]
};