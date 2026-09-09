export type DetectedEncoding = 'UTF-8' | 'UTF-8 (BOM付き)' | 'UTF-16LE' | 'UTF-16BE' | 'Shift_JIS'

/**
 * テキストファイルを文字コードを自動判定して読み込む。
 * Excel から書き出した CSV は Shift_JIS、UTF-8(BOM付き)、
 * 「Unicode テキスト」形式では UTF-16LE になるため、いずれも扱えるようにしている。
 */
export async function readTextFile(
  file: File
): Promise<{ text: string; encoding: DetectedEncoding }> {
  const bytes = new Uint8Array(await file.arrayBuffer())

  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return {
      text: new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, ''),
      encoding: 'UTF-8 (BOM付き)',
    }
  }
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return { text: new TextDecoder('utf-16le').decode(bytes), encoding: 'UTF-16LE' }
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return { text: new TextDecoder('utf-16be').decode(bytes), encoding: 'UTF-16BE' }
  }

  // BOM が無い場合は UTF-8 として厳密に読み、壊れていれば Shift_JIS とみなす
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), encoding: 'UTF-8' }
  } catch {
    return { text: new TextDecoder('shift_jis').decode(bytes), encoding: 'Shift_JIS' }
  }
}
