import Long from 'long'
import _m0 from 'protobufjs/minimal'

if (_m0.util.Long !== Long) {
  // biome-ignore lint/suspicious/noExplicitAny: legacy any usage
  _m0.util.Long = Long as any
  _m0.configure()
}
