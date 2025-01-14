import Svg, { SvgProps, Path } from 'react-native-svg';
const SvgBike = (props: SvgProps) => (
  <Svg fill="none" viewBox="0 0 24 24" accessibilityRole="image" {...props}>
    <Path
      fill="#000"
      fillRule="evenodd"
      d="M13 5a1 1 0 0 1 1-1h.512a3 3 0 0 1 2.873 2.138l1.165 3.882a5 5 0 1 1-1.916.574l-.28-.936-3.356 3.728.002.105A2.51 2.51 0 0 1 10.49 16H9.9A5.002 5.002 0 0 1 0 15a5 5 0 0 1 9.9-1h.59a.51.51 0 0 0 .413-.809L7.19 8.088A1.01 1.01 0 0 1 7.134 8H7a1 1 0 0 1 0-2h3a1 1 0 1 1 0 2h-.4l2.483 3.413 3.598-3.997-.211-.703A1 1 0 0 0 14.512 6H14a1 1 0 0 1-1-1Zm-5.17 9a3.001 3.001 0 1 0 0 2H5a1 1 0 1 1 0-2h2.83Zm9.4-1.422a3 3 0 1 0 1.916-.575l.812 2.71a1 1 0 0 1-1.916.574l-.813-2.709Z"
      clipRule="evenodd"
    />
  </Svg>
);
export default SvgBike;
