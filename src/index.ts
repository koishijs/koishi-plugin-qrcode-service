import { Context, Schema, Service } from 'koishi'
import Jimp from 'jimp'
import type { ScanResult, ImageSource, ScanOptions } from 'qr-scanner-wechat'
import { QRCodeToDataURLOptions, toDataURL } from 'qrcode'

export const name = 'qrcode'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})


declare module 'koishi' {
  interface Context {
    qrcode: Qrcode
  }
}

export interface Result {
  text: string | null;
  rect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

class Qrcode extends Service {
  scan: (input: ImageSource, options?: ScanOptions) => Promise<ScanResult>;
  constructor(ctx: Context) {
    super(ctx, 'qrcode')
  }

  async start() {
    const { scan } = await import('qr-scanner-wechat')
    this.scan = scan
  }

  public async decode(arr: Buffer): Promise<Result> {
    const image = await Jimp.read(arr);

    const { width, height } = image.bitmap
    // const len = width * height * 4

    // const luminancesUint8Array = new Uint8Array(len);

    // for (let i = 0; i < len; i++) {
    //   luminancesUint8Array[i] = ((image.bitmap.data[i * 4] + image.bitmap.data[i * 4 + 1] * 2 + image.bitmap.data[i * 4 + 2]) / 4) & 0xFF;
    // }
    const result = await this.scan({
      data: Uint8ClampedArray.from(image.bitmap.data),
      width: width,
      height: height,
    })
    return {
      ...result
    }
  }

  public async decodeFromUrl(url: string): Promise<Result> {
    const response = await this.ctx.http.get(url, {
      responseType: 'arraybuffer'
    });
    return this.decode(response)
  }

  public async encode(text: string, options?: QRCodeToDataURLOptions) {
    return toDataURL(text, options)
  }
}

export function apply(ctx: Context) {
  ctx.plugin(Qrcode)
}
