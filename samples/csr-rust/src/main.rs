use std::str::FromStr;

use x509_cert::builder::{RequestBuilder, Builder};
use x509_cert::der::EncodePem;
use x509_cert::name::Name;
use rsa::pkcs1v15::SigningKey;
use rsa::pkcs8::{DecodePrivateKey, LineEnding};
use rsa::sha2::Sha256;
use rsa::RsaPrivateKey;

// import some WASM runtime functions from the module `env`
#[link(wasm_import_module = "env")]
extern "C" {
    fn _debug(s: &str) -> i32;
}

/// Allocate memory into the module's linear memory
/// and return the offset to the start of the block.
#[no_mangle]
pub fn csr_malloc(len: usize) -> *mut u8 {
    // create a new mutable buffer with capacity `len`
    let mut buf = Vec::with_capacity(len);
    // take a mutable pointer to the buffer
    let ptr = buf.as_mut_ptr();
    // take ownership of the memory block and
    // ensure that its destructor is not
    // called when the object goes out of scope
    // at the end of the function
    std::mem::forget(buf);
    // return the pointer so the runtime
    // can write data at this offset
    return ptr;
}

/// Free memory from the module's linear memory
#[no_mangle]
pub unsafe fn csr_free(ptr: *mut u8, size: usize) {
    let data = Vec::from_raw_parts(ptr, size, size);

    std::mem::drop(data);
}

#[macro_export]
macro_rules! println {
    () => {
        _debug("\n")
    };
    ($($arg:tt)*) => {{
        let s = format!($($arg)*);
        _debug(&s);
    }};
}


//Using single return value since the multi return value is still buggy. See https://github.com/rust-lang/rust/issues/73755
#[no_mangle]
pub unsafe extern "C" fn csr_gen(priv_key: &[u8]) -> i64 {
    let subject = match Name::from_str("CN=banzai.cloud") {
        Ok(name) => name,
        Err(err) => { println!("error parsing name: {}", err); return 0 },
    };

    let private_key = match RsaPrivateKey::from_pkcs8_der(priv_key) {
        Ok(key) => key,
        Err(err) => { println!("error parsing private key: {}", err); return 0 },
    };
    let signing_key = SigningKey::<Sha256>::new(private_key);
    
    let builder = match RequestBuilder::new(subject, &signing_key) {
        Ok(builder) => builder,
        Err(err) => { println!("error creating builder: {}", err); return 0 },
    };
    let cert_req = match builder.build() {
        Ok(cert_req) => cert_req,
        Err(err) => { println!("error building cert request: {}", err); return 0 },
    };
    let encoded_csr = match cert_req.to_pem(LineEnding::LF) {
        Ok(encoded_csr) => encoded_csr,
        Err(err) => { println!("error encoding cert request: {}", err); return 0 },
    };

    ((encoded_csr.as_ptr() as i64) << 32) | (encoded_csr.len() as i64)
}

fn main() {}