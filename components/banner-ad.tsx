import { Platform, View, Text } from 'react-native';

// react-native-google-mobile-ads は Development Build でのみ利用可能
// Expo Go ではクラッシュするため、動的インポートで安全に読み込む
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;

try {
  const Ads = require('react-native-google-mobile-ads');
  BannerAd = Ads.BannerAd;
  BannerAdSize = Ads.BannerAdSize;
  TestIds = Ads.TestIds;
} catch {
  // Expo Go などネイティブモジュールがない環境では何もしない
}

const adUnitId = __DEV__
  ? 'ca-app-pub-3940256099942544/6300978111' // テストID
  : 'ca-app-pub-5618565826659468/4647498034'; // 本番ID

export function BannerAdView() {
  // ネイティブモジュールが利用できない場合は何も表示しない
  if (!BannerAd || !BannerAdSize) {
    if (__DEV__) {
      // 開発時のみプレースホルダーを表示（Expo Go での視認用）
      return (
        <View
          style={{
            height: 50,
            backgroundColor: '#F3F4F6',
            justifyContent: 'center',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          }}
        >
          <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
            [広告表示エリア] Development Build で実際の広告が表示されます
          </Text>
        </View>
      );
    }
    return null;
  }

  return (
    <BannerAd
      unitId={adUnitId}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
    />
  );
}
