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
pub unsafe extern "C" fn gen_csr(priv_key: *mut u8, priv_key_lenght: usize) -> i64 {
    println!("Generating CSR");
//     let raw_priv_key = "-----BEGIN PRIVATE KEY-----
// MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCmtj45x5lT7LnG
// yv+svbRqcgg6ctYjNTiUym5Ge/6zorsPrxRCHpW1rDdb2Ku4SD0qHsDhEInKTNqM
// B7vGjx7RIA2rVl0blfkumXybJZQYneMv8BvzXu+OVPMPZEEQO0PW46nqBP1WzdqU
// afKE9Df15tj0S99cvew8V/OWnTSqTZwcLnaJnSOZCJ4atafvtYCGpCRLaCv97gxd
// +hn1HJbNBmc/qD2ImvxnWO9QM0zYDr2ChwdsePiHlkEF9vnfpatsqC+/HYjyhgpt
// hZt5ImU2qT+EeWmGTbMfqN/ioGz/hfYXDcbl6tLTHK5pMBvA8LifgG0SzqN2usXT
// crYnwx/ZAgMBAAECggEAdDZ0WCjYrJVHx9k4s70maFGHhN8KgU6XW7lleAL1wVl+
// FufQMmtJp3QevwriYbsR0CvR/tJdi0VZz+WQM1EPhW5XuQmiLBm2s5JRN4HRo/tk
// JMW3ZkbWrZxwN1mGtX7qwoC/sJ+7zmf/qBfW9HGeFO/QazP8x5SpekNBTcvWq6P/
// /A4dcO0jsbXk3aA4vYb8O1qOPw/KLihVhnJduqyWPMlvNq0bZjYqnj4kwb0fGrwd
// 41z2J3rsczB0v1U+HL1Ps7GQqKVxpNZQwUTQNdQACYzjqSvSDJ843IPINWUQits+
// ke2g0U53xcQ2ISBf24+S4nNidaR0nIroeLUjgknFAQKBgQDZSZI4oSIBLS5V7hWk
// v6lfGgz7yeWtepfADr5T7l/hnn3EnzQBv0KfzKNvwDSfPIG7SkejGQsny59a/Rhs
// uXn7Ey+ziO3rdTkbOasrMl32Odn0UE5bMShdzVIANRRYAn2oQCOO2D4pl3UKGWGf
// b5OLgAYFtJc5HXqck/ujMQaJ4QKBgQDEae9IxIT+SNrd+OAasMe6mK5CKricwBO+
// +4tja3LdN6LDycdZ5f4+6gpTT8RlZouThhI1DqCt9py1itg7zrf6VWrx6IUI4XQm
// jTGYGPk+FmhII2ZI4czOGOeQyiKbIKlIFtnL18WdCF7yckEvgoFJ9XpMPavZ2r8m
// TAZj6S+E+QKBgErDq9JcbyzkdOsQTtYvNIIKnqkMYUD9y7VD3W1XuhoRxMig1u46
// 9xuw+BN9mR2pXiIpfti5x0LcJ2rRZ1QRxc0EXwdxeBvqa8nYX/MvE3GjmkEcWLm8
// Al20RiDYIrXdtYrs9s8xzMHW4WimLxcC90uqs2fHKbl3UTcLHCycs9lBAoGBAImo
// ZVhuw3ckwKDKCOcr9w/Ean1dS74wsKYtzmeDqyF4GM934AwVsbeOeGYjhdY7pJ9k
// W+Zrthm2ueZSxXJFU5RTwXyCJpsuyCUs2BFtj2IAel300X9LIitgMQu9X7uxjHNF
// 8Kd5Nrr0Xvc1NJKDuPGI5ooAvy0Urtu8dM4ZZIChAoGBALWMBcOV2G2P8nmetcPz
// R/PUYvQGv9h0bKafurlxTVIPETNviGmN4TEYa/lOaYp2irBNrJ3ocRigtzHA8xn0
// ZFn7mRfTRtZO9xyLmoVJpa9A+YXLMaJVKaxZTIsqKzayvr+altsS+Pe7DcDypSUJ
// gpde4liGsq0/gY/JSFF8lGHx
// -----END PRIVATE KEY-----";
    let binding = String::from_raw_parts(priv_key, priv_key_lenght, priv_key_lenght);
    let raw_priv_key = binding.as_str();

    let subject = match Name::from_str("CN=banzai.cloud") {
        Ok(name) => name,
        Err(err) => { println!("error parsing name: {}", err); return 0 },
    };

    let private_key = match RsaPrivateKey::from_pkcs8_pem(raw_priv_key) {
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