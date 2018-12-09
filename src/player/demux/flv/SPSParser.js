import ExpGolomb from '../../common/ExpGolomb';

/**
 * SPS 转换器
 *
 * @export
 * @class SPSParser
 * @author zhenliang.sun
 */
export default class SPSParser {
  static getProfileString(profileIdc) {
    switch (profileIdc) {
    case 66:
      return 'Baseline';
    case 77:
      return 'Main';
    case 88:
      return 'Extended';
    case 100:
      return 'High';
    case 110:
      return 'High10';
    case 122:
      return 'High422';
    case 244:
      return 'High444';
    default:
      return 'Unknown';
    }
  }

  static getLevelString(levelIdc) {
    return (levelIdc / 10).toFixed(1);
  }

  static getChromaFormatString(chroma) {
    switch (chroma) {
    case 420:
      return '4:2:0';
    case 422:
      return '4:2:2';
    case 444:
      return '4:4:4';
    default:
      return 'Unknown';
    }
  }

  static parseSPS(originArr) {
    let rbsp = SPSParser._ebsp2rbsp(originArr);

    const stream = new ExpGolomb(rbsp);
    const spsConfig = stream.readSPS();
    const {
      chromaFormat,
      levelIdc,
      profileIdc
    } = spsConfig;

    spsConfig.profileString = SPSParser.getProfileString(profileIdc);
    spsConfig.levelString = SPSParser.getLevelString(levelIdc);
    spsConfig.chromaFormatString = SPSParser.getChromaFormatString(chromaFormat);

    return spsConfig;
  }

  static _ebsp2rbsp(originArr) {
    const originLen = originArr.byteLength;
    const dist = new Uint8Array(originLen);

    let distSize = 0;

    for (let i = 0, len = originLen; i < len; i += 1) {
      if (i > 2 && originArr[i] === 3 && originArr[i - 1] === 0 && originArr[i - 2] === 0) {
        continue;
      }
      distSize += 1;
      dist[distSize] = originArr[i];
    }

    return new Uint8Array(dist.buffer, 0, distSize);
  }
}