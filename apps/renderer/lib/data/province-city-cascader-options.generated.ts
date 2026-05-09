/**
 * Province/city options for the account proxy city cascader.
 * Keep this constant directly editable so product data can be adjusted quickly.
 */

export type ProvinceCityCascaderCity = {
  cityId: number;
  cityName: string;
};

export type ProvinceCityCascaderProvince = {
  provinceId: number;
  provinceName: string;
  cities: ProvinceCityCascaderCity[];
};

export const PROVINCE_CITY_CASCADER_OPTIONS: readonly ProvinceCityCascaderProvince[] = [
  {
    "provinceId": 0,
    "provinceName": "北京市",
    "cities": [
      {
        "cityId": 0,
        "cityName": "北京市"
      }
    ]
  },
  {
    "provinceId": 1,
    "provinceName": "天津市",
    "cities": [
      {
        "cityId": 1,
        "cityName": "天津市"
      }
    ]
  },
  {
    "provinceId": 2,
    "provinceName": "上海市",
    "cities": [
      {
        "cityId": 3,
        "cityName": "上海市"
      }
    ]
  },
  {
    "provinceId": 3,
    "provinceName": "重庆市",
    "cities": [
      {
        "cityId": 4,
        "cityName": "重庆市"
      }
    ]
  },
  {
    "provinceId": 4,
    "provinceName": "黑龙江省",
    "cities": [
      {
        "cityId": 7,
        "cityName": "大兴安岭地区"
      },
      {
        "cityId": 8,
        "cityName": "黑河市"
      },
      {
        "cityId": 9,
        "cityName": "齐齐哈尔市"
      },
      {
        "cityId": 10,
        "cityName": "绥化市"
      },
      {
        "cityId": 11,
        "cityName": "鹤岗市"
      },
      {
        "cityId": 12,
        "cityName": "佳木斯市"
      },
      {
        "cityId": 13,
        "cityName": "伊春市"
      },
      {
        "cityId": 14,
        "cityName": "双鸭山市"
      },
      {
        "cityId": 15,
        "cityName": "哈尔滨市"
      },
      {
        "cityId": 16,
        "cityName": "鸡西市"
      },
      {
        "cityId": 18,
        "cityName": "大庆市"
      },
      {
        "cityId": 19,
        "cityName": "七台河市"
      },
      {
        "cityId": 20,
        "cityName": "牡丹江市"
      }
    ]
  },
  {
    "provinceId": 5,
    "provinceName": "吉林省",
    "cities": [
      {
        "cityId": 22,
        "cityName": "辽源市"
      },
      {
        "cityId": 23,
        "cityName": "通化市"
      },
      {
        "cityId": 24,
        "cityName": "白城市"
      },
      {
        "cityId": 25,
        "cityName": "松原市"
      },
      {
        "cityId": 26,
        "cityName": "长春市"
      },
      {
        "cityId": 27,
        "cityName": "吉林市"
      },
      {
        "cityId": 29,
        "cityName": "延边朝鲜族自治州"
      },
      {
        "cityId": 31,
        "cityName": "白山市"
      },
      {
        "cityId": 32,
        "cityName": "四平市"
      }
    ]
  },
  {
    "provinceId": 6,
    "provinceName": "辽宁省",
    "cities": [
      {
        "cityId": 33,
        "cityName": "葫芦岛市"
      },
      {
        "cityId": 34,
        "cityName": "盘锦市"
      },
      {
        "cityId": 35,
        "cityName": "辽阳市"
      },
      {
        "cityId": 36,
        "cityName": "铁岭市"
      },
      {
        "cityId": 37,
        "cityName": "阜新市"
      },
      {
        "cityId": 38,
        "cityName": "朝阳市"
      },
      {
        "cityId": 39,
        "cityName": "锦州市"
      },
      {
        "cityId": 40,
        "cityName": "鞍山市"
      },
      {
        "cityId": 41,
        "cityName": "沈阳市"
      },
      {
        "cityId": 42,
        "cityName": "本溪市"
      },
      {
        "cityId": 43,
        "cityName": "抚顺市"
      },
      {
        "cityId": 44,
        "cityName": "营口市"
      },
      {
        "cityId": 45,
        "cityName": "丹东市"
      },
      {
        "cityId": 47,
        "cityName": "大连市"
      }
    ]
  },
  {
    "provinceId": 7,
    "provinceName": "内蒙古自治区",
    "cities": [
      {
        "cityId": 48,
        "cityName": "呼伦贝尔市"
      },
      {
        "cityId": 49,
        "cityName": "兴安盟"
      },
      {
        "cityId": 50,
        "cityName": "锡林郭勒盟"
      },
      {
        "cityId": 51,
        "cityName": "巴彦淖尔市"
      },
      {
        "cityId": 52,
        "cityName": "包头市"
      },
      {
        "cityId": 53,
        "cityName": "呼和浩特市"
      },
      {
        "cityId": 55,
        "cityName": "通辽市"
      },
      {
        "cityId": 56,
        "cityName": "赤峰市"
      },
      {
        "cityId": 57,
        "cityName": "乌海市"
      },
      {
        "cityId": 58,
        "cityName": "鄂尔多斯市"
      },
      {
        "cityId": 59,
        "cityName": "乌兰察布市"
      },
      {
        "cityId": 389,
        "cityName": "阿拉善盟"
      },
      {
        "cityId": 433,
        "cityName": "乌兰浩特市"
      }
    ]
  },
  {
    "provinceId": 8,
    "provinceName": "宁夏回族自治区",
    "cities": [
      {
        "cityId": 60,
        "cityName": "石嘴山市"
      },
      {
        "cityId": 61,
        "cityName": "银川市"
      },
      {
        "cityId": 62,
        "cityName": "吴忠市"
      },
      {
        "cityId": 63,
        "cityName": "固原市"
      },
      {
        "cityId": 393,
        "cityName": "中卫市"
      }
    ]
  },
  {
    "provinceId": 9,
    "provinceName": "甘肃省",
    "cities": [
      {
        "cityId": 64,
        "cityName": "张掖市"
      },
      {
        "cityId": 65,
        "cityName": "金昌市"
      },
      {
        "cityId": 66,
        "cityName": "武威市"
      },
      {
        "cityId": 67,
        "cityName": "兰州市"
      },
      {
        "cityId": 68,
        "cityName": "白银市"
      },
      {
        "cityId": 69,
        "cityName": "定西市"
      },
      {
        "cityId": 70,
        "cityName": "平凉市"
      },
      {
        "cityId": 71,
        "cityName": "庆阳市"
      },
      {
        "cityId": 72,
        "cityName": "甘南藏族自治州"
      },
      {
        "cityId": 73,
        "cityName": "临夏回族自治州"
      },
      {
        "cityId": 74,
        "cityName": "天水市"
      },
      {
        "cityId": 75,
        "cityName": "嘉峪关市"
      },
      {
        "cityId": 76,
        "cityName": "酒泉市"
      },
      {
        "cityId": 77,
        "cityName": "陇南市"
      }
    ]
  },
  {
    "provinceId": 10,
    "provinceName": "新疆维吾尔自治区",
    "cities": [
      {
        "cityId": 78,
        "cityName": "昌吉回族自治州"
      },
      {
        "cityId": 79,
        "cityName": "克孜勒苏柯尔克孜自治州"
      },
      {
        "cityId": 80,
        "cityName": "伊犁哈萨克自治州"
      },
      {
        "cityId": 81,
        "cityName": "阿拉尔市"
      },
      {
        "cityId": 82,
        "cityName": "克拉玛依市"
      },
      {
        "cityId": 83,
        "cityName": "博尔塔拉蒙古自治州"
      },
      {
        "cityId": 84,
        "cityName": "乌鲁木齐市"
      },
      {
        "cityId": 85,
        "cityName": "吐鲁番市"
      },
      {
        "cityId": 86,
        "cityName": "阿克苏地区"
      },
      {
        "cityId": 87,
        "cityName": "石河子市"
      },
      {
        "cityId": 88,
        "cityName": "喀什地区"
      },
      {
        "cityId": 89,
        "cityName": "和田地区"
      },
      {
        "cityId": 90,
        "cityName": "哈密市"
      },
      {
        "cityId": 397,
        "cityName": "塔城地区"
      },
      {
        "cityId": 398,
        "cityName": "阿勒泰地区"
      },
      {
        "cityId": 419,
        "cityName": "巴音郭楞蒙古自治州"
      },
      {
        "cityId": 458,
        "cityName": "五家渠市"
      },
      {
        "cityId": 469,
        "cityName": "北屯市"
      },
      {
        "cityId": 473,
        "cityName": "双河市"
      },
      {
        "cityId": 474,
        "cityName": "图木舒克市"
      }
    ]
  },
  {
    "provinceId": 11,
    "provinceName": "陕西省",
    "cities": [
      {
        "cityId": 92,
        "cityName": "榆林市"
      },
      {
        "cityId": 93,
        "cityName": "延安市"
      },
      {
        "cityId": 94,
        "cityName": "咸阳市"
      },
      {
        "cityId": 95,
        "cityName": "西安市"
      },
      {
        "cityId": 96,
        "cityName": "渭南市"
      },
      {
        "cityId": 97,
        "cityName": "汉中市"
      },
      {
        "cityId": 98,
        "cityName": "商洛市"
      },
      {
        "cityId": 99,
        "cityName": "安康市"
      },
      {
        "cityId": 100,
        "cityName": "铜川市"
      },
      {
        "cityId": 101,
        "cityName": "宝鸡市"
      }
    ]
  },
  {
    "provinceId": 12,
    "provinceName": "山西省",
    "cities": [
      {
        "cityId": 102,
        "cityName": "长治市"
      },
      {
        "cityId": 103,
        "cityName": "晋中市"
      },
      {
        "cityId": 104,
        "cityName": "朔州市"
      },
      {
        "cityId": 105,
        "cityName": "大同市"
      },
      {
        "cityId": 106,
        "cityName": "吕梁市"
      },
      {
        "cityId": 107,
        "cityName": "忻州市"
      },
      {
        "cityId": 108,
        "cityName": "太原市"
      },
      {
        "cityId": 109,
        "cityName": "阳泉市"
      },
      {
        "cityId": 110,
        "cityName": "临汾市"
      },
      {
        "cityId": 111,
        "cityName": "运城市"
      },
      {
        "cityId": 112,
        "cityName": "晋城市"
      }
    ]
  },
  {
    "provinceId": 13,
    "provinceName": "山东省",
    "cities": [
      {
        "cityId": 114,
        "cityName": "德州市"
      },
      {
        "cityId": 115,
        "cityName": "滨州市"
      },
      {
        "cityId": 116,
        "cityName": "烟台市"
      },
      {
        "cityId": 117,
        "cityName": "聊城市"
      },
      {
        "cityId": 118,
        "cityName": "济南市"
      },
      {
        "cityId": 119,
        "cityName": "泰安市"
      },
      {
        "cityId": 120,
        "cityName": "淄博市"
      },
      {
        "cityId": 121,
        "cityName": "潍坊市"
      },
      {
        "cityId": 122,
        "cityName": "青岛市"
      },
      {
        "cityId": 123,
        "cityName": "济宁市"
      },
      {
        "cityId": 124,
        "cityName": "日照市"
      },
      {
        "cityId": 126,
        "cityName": "枣庄市"
      },
      {
        "cityId": 127,
        "cityName": "东营市"
      },
      {
        "cityId": 128,
        "cityName": "威海市"
      },
      {
        "cityId": 129,
        "cityName": "莱芜市"
      },
      {
        "cityId": 130,
        "cityName": "临沂市"
      },
      {
        "cityId": 131,
        "cityName": "菏泽市"
      }
    ]
  },
  {
    "provinceId": 14,
    "provinceName": "河北省",
    "cities": [
      {
        "cityId": 132,
        "cityName": "邯郸市"
      },
      {
        "cityId": 133,
        "cityName": "衡水市"
      },
      {
        "cityId": 134,
        "cityName": "石家庄市"
      },
      {
        "cityId": 135,
        "cityName": "邢台市"
      },
      {
        "cityId": 136,
        "cityName": "张家口市"
      },
      {
        "cityId": 137,
        "cityName": "承德市"
      },
      {
        "cityId": 138,
        "cityName": "秦皇岛市"
      },
      {
        "cityId": 139,
        "cityName": "廊坊市"
      },
      {
        "cityId": 140,
        "cityName": "唐山市"
      },
      {
        "cityId": 141,
        "cityName": "保定市"
      },
      {
        "cityId": 142,
        "cityName": "沧州市"
      }
    ]
  },
  {
    "provinceId": 15,
    "provinceName": "河南省",
    "cities": [
      {
        "cityId": 143,
        "cityName": "安阳市"
      },
      {
        "cityId": 144,
        "cityName": "三门峡市"
      },
      {
        "cityId": 145,
        "cityName": "郑州市"
      },
      {
        "cityId": 146,
        "cityName": "南阳市"
      },
      {
        "cityId": 147,
        "cityName": "周口市"
      },
      {
        "cityId": 148,
        "cityName": "驻马店市"
      },
      {
        "cityId": 149,
        "cityName": "信阳市"
      },
      {
        "cityId": 150,
        "cityName": "开封市"
      },
      {
        "cityId": 151,
        "cityName": "洛阳市"
      },
      {
        "cityId": 152,
        "cityName": "平顶山市"
      },
      {
        "cityId": 153,
        "cityName": "焦作市"
      },
      {
        "cityId": 154,
        "cityName": "鹤壁市"
      },
      {
        "cityId": 155,
        "cityName": "新乡市"
      },
      {
        "cityId": 156,
        "cityName": "濮阳市"
      },
      {
        "cityId": 157,
        "cityName": "许昌市"
      },
      {
        "cityId": 158,
        "cityName": "漯河市"
      },
      {
        "cityId": 159,
        "cityName": "商丘市"
      },
      {
        "cityId": 160,
        "cityName": "济源市"
      }
    ]
  },
  {
    "provinceId": 16,
    "provinceName": "西藏自治区",
    "cities": [
      {
        "cityId": 161,
        "cityName": "那曲市"
      },
      {
        "cityId": 162,
        "cityName": "日喀则市"
      },
      {
        "cityId": 163,
        "cityName": "拉萨市"
      },
      {
        "cityId": 164,
        "cityName": "山南市"
      },
      {
        "cityId": 165,
        "cityName": "阿里地区"
      },
      {
        "cityId": 166,
        "cityName": "昌都市"
      },
      {
        "cityId": 167,
        "cityName": "林芝市"
      }
    ]
  },
  {
    "provinceId": 17,
    "provinceName": "云南省",
    "cities": [
      {
        "cityId": 168,
        "cityName": "昭通市"
      },
      {
        "cityId": 169,
        "cityName": "丽江市"
      },
      {
        "cityId": 170,
        "cityName": "曲靖市"
      },
      {
        "cityId": 171,
        "cityName": "保山市"
      },
      {
        "cityId": 172,
        "cityName": "大理白族自治州"
      },
      {
        "cityId": 173,
        "cityName": "楚雄彝族自治州"
      },
      {
        "cityId": 174,
        "cityName": "昆明市"
      },
      {
        "cityId": 176,
        "cityName": "玉溪市"
      },
      {
        "cityId": 177,
        "cityName": "临沧市"
      },
      {
        "cityId": 178,
        "cityName": "普洱市"
      },
      {
        "cityId": 179,
        "cityName": "红河哈尼族彝族自治州"
      },
      {
        "cityId": 180,
        "cityName": "文山壮族苗族自治州"
      },
      {
        "cityId": 181,
        "cityName": "西双版纳傣族自治州"
      },
      {
        "cityId": 182,
        "cityName": "德宏傣族景颇族自治州"
      },
      {
        "cityId": 183,
        "cityName": "怒江傈僳族自治州"
      },
      {
        "cityId": 184,
        "cityName": "迪庆藏族自治州"
      }
    ]
  },
  {
    "provinceId": 18,
    "provinceName": "四川省",
    "cities": [
      {
        "cityId": 185,
        "cityName": "甘孜藏族自治州"
      },
      {
        "cityId": 186,
        "cityName": "阿坝藏族羌族自治州"
      },
      {
        "cityId": 187,
        "cityName": "凉山彝族自治州"
      },
      {
        "cityId": 188,
        "cityName": "成都市"
      },
      {
        "cityId": 189,
        "cityName": "绵阳市"
      },
      {
        "cityId": 190,
        "cityName": "雅安市"
      },
      {
        "cityId": 192,
        "cityName": "乐山市"
      },
      {
        "cityId": 193,
        "cityName": "宜宾市"
      },
      {
        "cityId": 194,
        "cityName": "巴中市"
      },
      {
        "cityId": 195,
        "cityName": "达州市"
      },
      {
        "cityId": 196,
        "cityName": "遂宁市"
      },
      {
        "cityId": 197,
        "cityName": "南充市"
      },
      {
        "cityId": 198,
        "cityName": "泸州市"
      },
      {
        "cityId": 199,
        "cityName": "自贡市"
      },
      {
        "cityId": 200,
        "cityName": "攀枝花市"
      },
      {
        "cityId": 201,
        "cityName": "德阳市"
      },
      {
        "cityId": 202,
        "cityName": "广元市"
      },
      {
        "cityId": 203,
        "cityName": "内江市"
      },
      {
        "cityId": 204,
        "cityName": "广安市"
      },
      {
        "cityId": 205,
        "cityName": "眉山市"
      },
      {
        "cityId": 206,
        "cityName": "资阳市"
      }
    ]
  },
  {
    "provinceId": 19,
    "provinceName": "贵州省",
    "cities": [
      {
        "cityId": 207,
        "cityName": "毕节市"
      },
      {
        "cityId": 208,
        "cityName": "遵义市"
      },
      {
        "cityId": 209,
        "cityName": "铜仁市"
      },
      {
        "cityId": 210,
        "cityName": "安顺市"
      },
      {
        "cityId": 211,
        "cityName": "贵阳市"
      },
      {
        "cityId": 212,
        "cityName": "黔西南布依族苗族自治州"
      },
      {
        "cityId": 213,
        "cityName": "六盘水市"
      },
      {
        "cityId": 407,
        "cityName": "黔南布依族苗族自治州"
      },
      {
        "cityId": 408,
        "cityName": "黔东南苗族侗族自治州"
      }
    ]
  },
  {
    "provinceId": 20,
    "provinceName": "广西壮族自治区",
    "cities": [
      {
        "cityId": 214,
        "cityName": "桂林市"
      },
      {
        "cityId": 215,
        "cityName": "河池市"
      },
      {
        "cityId": 216,
        "cityName": "柳州市"
      },
      {
        "cityId": 217,
        "cityName": "百色市"
      },
      {
        "cityId": 218,
        "cityName": "贵港市"
      },
      {
        "cityId": 219,
        "cityName": "梧州市"
      },
      {
        "cityId": 220,
        "cityName": "南宁市"
      },
      {
        "cityId": 221,
        "cityName": "钦州市"
      },
      {
        "cityId": 222,
        "cityName": "崇左市"
      },
      {
        "cityId": 223,
        "cityName": "北海市"
      },
      {
        "cityId": 224,
        "cityName": "防城港市"
      },
      {
        "cityId": 225,
        "cityName": "玉林市"
      },
      {
        "cityId": 226,
        "cityName": "贺州市"
      },
      {
        "cityId": 227,
        "cityName": "来宾市"
      }
    ]
  },
  {
    "provinceId": 21,
    "provinceName": "广东省",
    "cities": [
      {
        "cityId": 229,
        "cityName": "韶关市"
      },
      {
        "cityId": 230,
        "cityName": "清远市"
      },
      {
        "cityId": 231,
        "cityName": "梅州市"
      },
      {
        "cityId": 232,
        "cityName": "肇庆市"
      },
      {
        "cityId": 233,
        "cityName": "广州市"
      },
      {
        "cityId": 234,
        "cityName": "惠州市"
      },
      {
        "cityId": 235,
        "cityName": "河源市"
      },
      {
        "cityId": 236,
        "cityName": "汕头市"
      },
      {
        "cityId": 237,
        "cityName": "深圳市"
      },
      {
        "cityId": 238,
        "cityName": "汕尾市"
      },
      {
        "cityId": 239,
        "cityName": "湛江市"
      },
      {
        "cityId": 240,
        "cityName": "阳江市"
      },
      {
        "cityId": 241,
        "cityName": "茂名市"
      },
      {
        "cityId": 246,
        "cityName": "珠海市"
      },
      {
        "cityId": 247,
        "cityName": "佛山市"
      },
      {
        "cityId": 248,
        "cityName": "江门市"
      },
      {
        "cityId": 249,
        "cityName": "东莞市"
      },
      {
        "cityId": 250,
        "cityName": "中山市"
      },
      {
        "cityId": 251,
        "cityName": "潮州市"
      },
      {
        "cityId": 252,
        "cityName": "揭阳市"
      },
      {
        "cityId": 253,
        "cityName": "云浮市"
      }
    ]
  },
  {
    "provinceId": 22,
    "provinceName": "福建省",
    "cities": [
      {
        "cityId": 254,
        "cityName": "莆田市"
      },
      {
        "cityId": 256,
        "cityName": "南平市"
      },
      {
        "cityId": 257,
        "cityName": "宁德市"
      },
      {
        "cityId": 258,
        "cityName": "福州市"
      },
      {
        "cityId": 259,
        "cityName": "龙岩市"
      },
      {
        "cityId": 260,
        "cityName": "三明市"
      },
      {
        "cityId": 261,
        "cityName": "泉州市"
      },
      {
        "cityId": 262,
        "cityName": "漳州市"
      },
      {
        "cityId": 263,
        "cityName": "厦门市"
      }
    ]
  },
  {
    "provinceId": 23,
    "provinceName": "湖南省",
    "cities": [
      {
        "cityId": 264,
        "cityName": "张家界市"
      },
      {
        "cityId": 265,
        "cityName": "岳阳市"
      },
      {
        "cityId": 266,
        "cityName": "怀化市"
      },
      {
        "cityId": 267,
        "cityName": "长沙市"
      },
      {
        "cityId": 268,
        "cityName": "邵阳市"
      },
      {
        "cityId": 269,
        "cityName": "益阳市"
      },
      {
        "cityId": 270,
        "cityName": "郴州市"
      },
      {
        "cityId": 274,
        "cityName": "株洲市"
      },
      {
        "cityId": 275,
        "cityName": "湘潭市"
      },
      {
        "cityId": 276,
        "cityName": "衡阳市"
      },
      {
        "cityId": 277,
        "cityName": "娄底市"
      },
      {
        "cityId": 278,
        "cityName": "常德市"
      },
      {
        "cityId": 410,
        "cityName": "永州市"
      },
      {
        "cityId": 411,
        "cityName": "湘西土家族苗族自治州"
      }
    ]
  },
  {
    "provinceId": 24,
    "provinceName": "湖北省",
    "cities": [
      {
        "cityId": 280,
        "cityName": "荆门市"
      },
      {
        "cityId": 281,
        "cityName": "荆州市"
      },
      {
        "cityId": 282,
        "cityName": "黄冈市"
      },
      {
        "cityId": 283,
        "cityName": "恩施土家族苗族自治州"
      },
      {
        "cityId": 284,
        "cityName": "武汉市"
      },
      {
        "cityId": 285,
        "cityName": "黄石市"
      },
      {
        "cityId": 286,
        "cityName": "鄂州市"
      },
      {
        "cityId": 287,
        "cityName": "孝感市"
      },
      {
        "cityId": 288,
        "cityName": "咸宁市"
      },
      {
        "cityId": 289,
        "cityName": "随州市"
      },
      {
        "cityId": 290,
        "cityName": "仙桃市"
      },
      {
        "cityId": 291,
        "cityName": "天门市"
      },
      {
        "cityId": 292,
        "cityName": "潜江市"
      },
      {
        "cityId": 293,
        "cityName": "神农架林区"
      },
      {
        "cityId": 412,
        "cityName": "宜昌市"
      },
      {
        "cityId": 413,
        "cityName": "襄阳市"
      },
      {
        "cityId": 414,
        "cityName": "十堰市"
      }
    ]
  },
  {
    "provinceId": 25,
    "provinceName": "江西省",
    "cities": [
      {
        "cityId": 298,
        "cityName": "萍乡市"
      },
      {
        "cityId": 299,
        "cityName": "新余市"
      },
      {
        "cityId": 300,
        "cityName": "宜春市"
      },
      {
        "cityId": 301,
        "cityName": "赣州市"
      },
      {
        "cityId": 302,
        "cityName": "九江市"
      },
      {
        "cityId": 303,
        "cityName": "景德镇市"
      },
      {
        "cityId": 304,
        "cityName": "南昌市"
      },
      {
        "cityId": 305,
        "cityName": "鹰潭市"
      },
      {
        "cityId": 306,
        "cityName": "上饶市"
      },
      {
        "cityId": 307,
        "cityName": "抚州市"
      },
      {
        "cityId": 416,
        "cityName": "吉安市"
      }
    ]
  },
  {
    "provinceId": 26,
    "provinceName": "浙江省",
    "cities": [
      {
        "cityId": 308,
        "cityName": "湖州市"
      },
      {
        "cityId": 314,
        "cityName": "舟山市"
      },
      {
        "cityId": 315,
        "cityName": "杭州市"
      },
      {
        "cityId": 316,
        "cityName": "嘉兴市"
      },
      {
        "cityId": 318,
        "cityName": "金华市"
      },
      {
        "cityId": 319,
        "cityName": "绍兴市"
      },
      {
        "cityId": 320,
        "cityName": "宁波市"
      },
      {
        "cityId": 321,
        "cityName": "衢州市"
      },
      {
        "cityId": 322,
        "cityName": "丽水市"
      },
      {
        "cityId": 323,
        "cityName": "台州市"
      },
      {
        "cityId": 324,
        "cityName": "温州市"
      }
    ]
  },
  {
    "provinceId": 27,
    "provinceName": "江苏省",
    "cities": [
      {
        "cityId": 325,
        "cityName": "无锡市"
      },
      {
        "cityId": 326,
        "cityName": "苏州市"
      },
      {
        "cityId": 331,
        "cityName": "镇江市"
      },
      {
        "cityId": 332,
        "cityName": "泰州市"
      },
      {
        "cityId": 333,
        "cityName": "宿迁市"
      },
      {
        "cityId": 334,
        "cityName": "徐州市"
      },
      {
        "cityId": 335,
        "cityName": "连云港市"
      },
      {
        "cityId": 336,
        "cityName": "淮安市"
      },
      {
        "cityId": 337,
        "cityName": "南京市"
      },
      {
        "cityId": 338,
        "cityName": "扬州市"
      },
      {
        "cityId": 339,
        "cityName": "盐城市"
      },
      {
        "cityId": 340,
        "cityName": "南通市"
      },
      {
        "cityId": 341,
        "cityName": "常州市"
      }
    ]
  },
  {
    "provinceId": 28,
    "provinceName": "安徽省",
    "cities": [
      {
        "cityId": 342,
        "cityName": "淮南市"
      },
      {
        "cityId": 343,
        "cityName": "马鞍山市"
      },
      {
        "cityId": 344,
        "cityName": "淮北市"
      },
      {
        "cityId": 345,
        "cityName": "铜陵市"
      },
      {
        "cityId": 346,
        "cityName": "滁州市"
      },
      {
        "cityId": 348,
        "cityName": "池州市"
      },
      {
        "cityId": 349,
        "cityName": "宣城市"
      },
      {
        "cityId": 350,
        "cityName": "亳州市"
      },
      {
        "cityId": 351,
        "cityName": "宿州市"
      },
      {
        "cityId": 352,
        "cityName": "阜阳市"
      },
      {
        "cityId": 353,
        "cityName": "六安市"
      },
      {
        "cityId": 354,
        "cityName": "蚌埠市"
      },
      {
        "cityId": 355,
        "cityName": "合肥市"
      },
      {
        "cityId": 356,
        "cityName": "芜湖市"
      },
      {
        "cityId": 357,
        "cityName": "安庆市"
      },
      {
        "cityId": 358,
        "cityName": "黄山市"
      }
    ]
  },
  {
    "provinceId": 29,
    "provinceName": "青海省",
    "cities": [
      {
        "cityId": 359,
        "cityName": "海北藏族自治州"
      },
      {
        "cityId": 360,
        "cityName": "海南藏族自治州"
      },
      {
        "cityId": 361,
        "cityName": "西宁市"
      },
      {
        "cityId": 362,
        "cityName": "玉树藏族自治州"
      },
      {
        "cityId": 363,
        "cityName": "黄南藏族自治州"
      },
      {
        "cityId": 364,
        "cityName": "果洛藏族自治州"
      },
      {
        "cityId": 365,
        "cityName": "海西蒙古族藏族自治州"
      },
      {
        "cityId": 366,
        "cityName": "海东市"
      }
    ]
  },
  {
    "provinceId": 30,
    "provinceName": "海南省",
    "cities": [
      {
        "cityId": 367,
        "cityName": "海口市"
      },
      {
        "cityId": 368,
        "cityName": "三亚市"
      },
      {
        "cityId": 460,
        "cityName": "文昌市"
      },
      {
        "cityId": 461,
        "cityName": "昌江黎族自治县"
      },
      {
        "cityId": 462,
        "cityName": "乐东黎族自治县"
      },
      {
        "cityId": 463,
        "cityName": "儋州市"
      },
      {
        "cityId": 464,
        "cityName": "万宁市"
      },
      {
        "cityId": 465,
        "cityName": "陵水黎族自治县"
      },
      {
        "cityId": 466,
        "cityName": "定安县"
      },
      {
        "cityId": 467,
        "cityName": "东方市"
      },
      {
        "cityId": 468,
        "cityName": "澄迈县"
      },
      {
        "cityId": 470,
        "cityName": "琼中黎族苗族自治县"
      },
      {
        "cityId": 471,
        "cityName": "保亭黎族苗族自治县"
      },
      {
        "cityId": 472,
        "cityName": "屯昌县"
      },
      {
        "cityId": 475,
        "cityName": "琼海市"
      },
      {
        "cityId": 476,
        "cityName": "五指山市"
      },
      {
        "cityId": 477,
        "cityName": "临高县"
      },
      {
        "cityId": 478,
        "cityName": "白沙黎族自治县"
      }
    ]
  }
];

export type ProvinceCityCascaderProvinceId = (typeof PROVINCE_CITY_CASCADER_OPTIONS)[number]["provinceId"];
export type ProvinceCityCascaderCityId = (typeof PROVINCE_CITY_CASCADER_OPTIONS)[number]["cities"][number]["cityId"];
