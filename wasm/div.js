const BN = require('bn.js')
const MAX_INTEGER = new BN('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 16)

function div (a, b) {
  a = new BN(a)
  b = new BN(b)
  var r
  if (b.isZero()) {
    r = [0]
  } else {
    r = a.div(b).toArray()
  }
  return new Buffer(r)
}

const r = div(new BN('8000000000000000000000000000000000000000000000000000000000000000', 16), MAX_INTEGER)
console.log(r)
