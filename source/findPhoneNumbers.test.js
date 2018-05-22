import findNumbers, { searchPhoneNumbers, PhoneNumberSearch } from './findPhoneNumbers'
import metadata from '../metadata.min'

describe('findPhoneNumbers', () =>
{
	it('should find numbers', function()
	{
		findNumbers('2133734253', 'US', metadata).should.deep.equal
		([{
			phone    : '2133734253',
			country  : 'US',
			startsAt : 0,
			endsAt   : 10
		}])

		findNumbers('The number is +7 (800) 555-35-35 and not (213) 373-4253 as written in the document.', 'US', metadata).should.deep.equal
		([{
			phone    : '8005553535',
			country  : 'RU',
			startsAt : 14,
			endsAt   : 32
		},
		{
			phone    : '2133734253',
			country  : 'US',
			startsAt : 41,
			endsAt   : 55
		}])

		// No default country.
		findNumbers('The number is +7 (800) 555-35-35 as written in the document.', metadata).should.deep.equal
		([{
			phone    : '8005553535',
			country  : 'RU',
			startsAt : 14,
			endsAt   : 32
		}])

		// Passing `options` and default country.
		findNumbers('The number is +7 (800) 555-35-35 as written in the document.', 'US', { leniency: 'VALID' }, metadata).should.deep.equal
		([{
			phone    : '8005553535',
			country  : 'RU',
			startsAt : 14,
			endsAt   : 32
		}])

		// Passing `options`.
		findNumbers('The number is +7 (800) 555-35-35 as written in the document.', { leniency: 'VALID' }, metadata).should.deep.equal
		([{
			phone    : '8005553535',
			country  : 'RU',
			startsAt : 14,
			endsAt   : 32
		}])

		// Not a phone number and a phone number.
		findNumbers('Digits 12 are not a number, but +7 (800) 555-35-35 is.', { leniency: 'VALID' }, metadata).should.deep.equal
		([{
			phone    : '8005553535',
			country  : 'RU',
			startsAt : 32,
			endsAt   : 50
		}])

		// Phone number extension.
		findNumbers('Date 02/17/2018 is not a number, but +7 (800) 555-35-35 ext. 123 is.', { leniency: 'VALID' }, metadata).should.deep.equal
		([{
			phone    : '8005553535',
			country  : 'RU',
			ext      : '123',
			startsAt : 37,
			endsAt   : 64
		}])
	})

	it('should find non-European digits', function()
	{
		// E.g. in Iraq they don't write `+442323234` but rather `+٤٤٢٣٢٣٢٣٤`.
		findNumbers('العَرَبِيَّة‎ +٤٤٣٣٣٣٣٣٣٣٣٣عَرَبِيّ‎', metadata).should.deep.equal
		([{
			country  : 'GB',
			phone    : '3333333333',
			startsAt : 14,
			endsAt   : 27
		}])
	})

	it('should iterate', function()
	{
		const expected_numbers =
		[{
			country : 'RU',
			phone   : '8005553535',
			// number   : '+7 (800) 555-35-35',
			startsAt : 14,
			endsAt   : 32
		},
		{
			country : 'US',
			phone   : '2133734253',
			// number   : '(213) 373-4253',
			startsAt : 41,
			endsAt   : 55
		}]

		for (const number of searchPhoneNumbers('The number is +7 (800) 555-35-35 and not (213) 373-4253 as written in the document.', 'US', metadata))
		{
			number.should.deep.equal(expected_numbers.shift())
		}

		expected_numbers.length.should.equal(0)
	})

	it('should work in edge cases', function()
	{
		let thrower

		// No input
		findNumbers('', metadata).should.deep.equal([])

		// No country metadata for this `require` country code
		thrower = () => findNumbers('123', 'ZZ', metadata)
		thrower.should.throw('Unknown country')

		// Numerical `value`
		thrower = () => findNumbers(2141111111, 'US')
		thrower.should.throw('A text for parsing must be a string.')

		// No metadata
		thrower = () => findNumbers('')
		thrower.should.throw('`metadata` argument not passed')
	})

	it('shouldn\'t find phone numbers which are part of non-phone-numbers', function()
	{
		findNumbers('The phone number is 231354125.', 'FR', metadata).should.deep.equal
		([{
			country  : 'FR',
			phone    : '231354125',
			startsAt : 20,
			endsAt   : 30
		}])

		findNumbers('The UUID is CA801c26f98cd16e231354125ad046e40b.', 'FR', metadata).should.deep.equal([])
	})
})

describe('PhoneNumberSearch', () =>
{
	it('should search for phone numbers', function()
	{
		const finder = new PhoneNumberSearch('The number is +7 (800) 555-35-35 and not (213) 373-4253 as written in the document.', { defaultCountry: 'US' }, metadata)

		finder.hasNext().should.equal(true)
		finder.next().should.deep.equal
		({
			country : 'RU',
			phone   : '8005553535',
			// number   : '+7 (800) 555-35-35',
			startsAt : 14,
			endsAt   : 32
		})

		finder.hasNext().should.equal(true)
		finder.next().should.deep.equal
		({
			country : 'US',
			phone   : '2133734253',
			// number   : '(213) 373-4253',
			startsAt : 41,
			endsAt   : 55
		})

		finder.hasNext().should.equal(false)
	})

	it('should work in edge cases', function()
	{
		// No options
		const search = new PhoneNumberSearch('', undefined, metadata)

		// No next element
		let thrower = () => search.next()
		thrower.should.throw('No next element')
	})
})