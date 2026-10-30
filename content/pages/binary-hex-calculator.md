---
title: Binary and Hex Calculator
seo_title: Binary and Hex Calculator With Two's Complement | Stack Row
description: Convert between binary, octal, decimal, and hexadecimal, do arithmetic in any base, and see signed two's complement patterns for 8 to 128-bit integers.
slug: /tools/binary-hex-calculator/
type: page
template: calculator
tool: binary-hex
order: 2
category: Developer and Data
card: Convert binary, decimal, hex, and octal, do arithmetic in any base, and check two's complement.
reviewed: 2026-10-28
primary_keyword: binary calculator
complete: true
---

# Binary and Hex Calculator

A binary and hex calculator converts whole numbers between base 2, base 8, base 10, and base 16 and performs arithmetic in any of them. This tool also shows bit length, grouped output, and signed two's complement patterns for 8-bit through 128-bit integers. Results update as you type, and every representation has its own copy button.

## How to Use the Binary and Hex Calculator

Pick a tab, type a value, and read the results. The calculator validates characters as you type.

- **Convert** reads one value in the base you choose and shows it in decimal, hexadecimal, binary, and octal.
- **Arithmetic** adds, subtracts, multiplies, or divides two values written in the same base.
- **Bit width** fixes the integer size. Automatic picks the smallest standard width that holds the value.
- **Integer type** switches between unsigned and signed. With Signed selected, binary, octal, and hex input is read as a two's complement bit pattern.

Prefixes such as 0x, 0b, and 0o are accepted, along with spaces and underscores used as digit separators. Load example adds FF and 1 in 8-bit hex to show what overflow looks like.

## How Base Conversion Works

Each digit's value is multiplied by a power of the base. In hexadecimal, digits run from 0 to 9 and then A to F for 10 to 15, so each hex digit maps to exactly four binary digits.

| Decimal | Hexadecimal | Binary | Octal |
|---|---|---|---|
| 10 | A | 1010 | 12 |
| 15 | F | 1111 | 17 |
| 255 | FF | 1111 1111 | 377 |
| 4096 | 1000 | 1 0000 0000 0000 | 10000 |

To convert hex to binary by hand, replace each hex digit with its four-bit pattern. To convert binary to hex, group bits in fours from the right. The [hexadecimal](https://en.wikipedia.org/wiki/Hexadecimal) entry lists the full digit table.

## Two's Complement and Bit Width

Computers store signed integers in [two's complement](https://en.wikipedia.org/wiki/Two%27s_complement). A negative number is written as 2 to the power of the bit width plus the value, so -1 in 8 bits is 1111 1111.

An n-bit signed integer holds values from -2 to the power of n-1 through 2 to the power of n-1 minus 1. An 8-bit signed integer covers -128 to 127, and an 8-bit unsigned integer covers 0 to 255. When a result falls outside the range, fixed-width hardware keeps only the low bits. The calculator flags this overflow and shows the wrapped pattern so you can see what a program would store.

## Worked Example

Add FF and 1 in hexadecimal with an 8-bit unsigned width. The exact sum is 100 in hex, or 256 in decimal.

The result needs 9 bits, so it does not fit in 8 bits. An 8-bit register would keep 0000 0000 and drop the carry. Switch the width to 16-bit and the warning clears, because 256 fits easily.

Now read FF as an 8-bit signed value. The pattern 1111 1111 has its top bit set, so it represents -1. The same bits mean 255 unsigned and -1 signed.

## Precision and Large Values

The calculator uses JavaScript BigInt, so integers stay exact up to 128 bits. Ordinary JavaScript numbers lose precision above 9,007,199,254,740,991, which MDN documents in its [BigInt reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt).

Division returns the integer quotient and reports the remainder, matching integer division in most programming languages. Bit patterns matter when you inspect binary data, set permission flags, or read hex dumps in [database visualization tools](/developer-data/database-visualization-tools/). Container images and registries also print digests in hex, a format that appears throughout [Podman and Docker](/developer-data/podman-vs-docker/) tooling.

## Methodology and Limitations

- Conversion and arithmetic use exact integer math with BigInt.
- Fractional values and floating-point formats such as IEEE 754 are not supported.
- Division truncates toward zero and reports the remainder separately.
- Fixed-width patterns wrap modulo 2 to the power of the width, which matches common hardware behavior.
- Values are limited to 128 bits to keep output readable.
- Inputs stay in your browser. Typing updates results without saving; selecting Calculate saves the calculation locally until you reset or forget it.

## Frequently Asked Questions

### How Do I Convert Decimal to Hexadecimal?

Divide the number by 16 repeatedly and record each remainder as a hex digit, reading from the last remainder to the first. The calculator does this instantly for values up to 128 bits.

### How Do I Convert Hex to Binary?

Replace each hex digit with its four-bit binary pattern. For example, A3 becomes 1010 0011 because A is 1010 and 3 is 0011.

### What Is Two's Complement?

Two's complement is the standard way computers store signed integers. To negate a value, invert every bit and add one. The top bit then indicates whether the number is negative.

### What Is the Range of an 8-Bit Integer?

An unsigned 8-bit integer holds 0 to 255. A signed 8-bit integer in two's complement holds -128 to 127.

### Why Does My Result Show an Overflow Warning?

The result needs more bits than the selected width. Fixed-width storage keeps only the low bits, so the stored value wraps around. Choose a larger width to hold the full result.

## Resources

- [MDN: BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)
- [MDN: Number.prototype.toString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toString)
- [Two's complement](https://en.wikipedia.org/wiki/Two%27s_complement)
- [Hexadecimal](https://en.wikipedia.org/wiki/Hexadecimal)
