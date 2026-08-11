const { withGradleProperties } = require("expo/config-plugins");

/** @param {import('expo/config-plugins').ExpoConfig} config */
module.exports = function withAndroidPackaging(config) {
  return withGradleProperties(config, (modConfig) => {
    const pickFirstKey = "android.packagingOptions.pickFirsts";
    const hasPickFirst = modConfig.modResults.some(
      (item) => item.type === "property" && item.key === pickFirstKey,
    );

    if (!hasPickFirst) {
      modConfig.modResults.push({
        type: "property",
        key: pickFirstKey,
        value: "**/libworklets.so",
      });
    }

    return modConfig;
  });
};
