(func $SLOAD
  (param $sp i32)
  (result i32)
  (call_import $storageLoad (get_local $sp) (get_local $sp))
  (return (get_local $sp))
)
