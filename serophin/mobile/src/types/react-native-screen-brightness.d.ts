declare module "react-native-screen-brightness" {
  const ScreenBrightness: {
    getBrightness(): Promise<number>;
    setBrightness(brightness: number): Promise<void>;
    getAppBrightness(): Promise<number>;
    setAppBrightness(brightness: number): Promise<void>;
  };
  export default ScreenBrightness;
}
