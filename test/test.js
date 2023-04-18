/* global describe, it */
/* eslint-env mocha */

require('dotenv').config();
const chaiExpect = require('chai').expect;
const CanadaPostClient = require('../lib/canadapost');

const cpc = new CanadaPostClient(process.env.CPC_USERNAME, process.env.CPC_PASSWORD, process.env.CPC_CUSTOMER);

describe('Canada Post', function () {
  this.timeout(20000);

  it('Discovers Domestic Services', () => {
    return cpc.discoverServices('V6G 3E2', 'CA', 'M5V 3L9')
      .then(result => {
        chaiExpect(result).to.be.an('array');
        chaiExpect(result).to.not.be.empty; // eslint-disable-line no-unused-expressions
        const aResult = result[0];
        chaiExpect(aResult).to.contain.keys('serviceName', 'serviceCode');
        chaiExpect(result.every(r => /^DOM\./.test(r.serviceCode))).to.be.true; // eslint-disable-line no-unused-expressions
      });
  });

  it('Discovers International Services (USA)', () => {
    return cpc.discoverServices('V6G 3E2', 'US')
      .then(result => {
        chaiExpect(result).to.be.an('array');
        chaiExpect(result).to.not.be.empty; // eslint-disable-line no-unused-expressions
        const aResult = result[0];
        chaiExpect(aResult).to.contain.keys('serviceName', 'serviceCode');
        chaiExpect(result.every(r => /^USA\./.test(r.serviceCode))).to.be.true; // eslint-disable-line no-unused-expressions
      });
  });

  it('Discovers International Services (Australia) with Postal Code', function () {
    return cpc.discoverServices('V6G 3E2', 'AU', '3000')
      .then(result => {
        chaiExpect(result).to.be.an('array');
        chaiExpect(result).to.not.be.empty; // eslint-disable-line no-unused-expressions
        const aResult = result[0];
        chaiExpect(aResult).to.contain.keys('serviceName', 'serviceCode');
        chaiExpect(result.every(r => /^INT\./.test(r.serviceCode))).to.be.true; // eslint-disable-line no-unused-expressions
      });
  });

  it('Gets Rates', () => {
    const rateQuery = {
      parcelCharacteristics: {
        weight: 1
      },
      originPostalCode: 'V5C2H2',
      destination: {
        domestic: {
          postalCode: 'V0N1B6'
        }
      }
    };

    return cpc.getRates(rateQuery)
      .then(result => {
        chaiExpect(result).to.be.an('array');
        chaiExpect(result).to.not.be.empty; // eslint-disable-line no-unused-expressions
        const aResult = result[0];
        chaiExpect(aResult).to.contain.keys('priceDetails', 'serviceCode', 'serviceName', 'serviceStandard', 'weightDetails');
        chaiExpect(aResult.priceDetails).to.contain.keys('base', 'due', 'taxes', 'options', 'adjustments');
        chaiExpect(aResult.priceDetails.options).to.be.an('array');
        chaiExpect(aResult.priceDetails.adjustments).to.be.an('array');
        chaiExpect(aResult.priceDetails.taxes).to.be.an('object');
      });
  });

  it('Returns the same results for discoverServices and getRates', () => {
    const rateQuery = {
      parcelCharacteristics: {
        weight: 0.2,
        dimensions: {
          length: 23,
          width: 23,
          height: 15
        }
      },
      originPostalCode: 'M9W7G6',
      destination: {
        domestic: {
          postalCode: 'H7R4X4'
        }
      }
    };

    return cpc.discoverServices('M9W7G6', 'CA', 'H7R4X4')
      .then(result => {
        chaiExpect(result).to.be.an('array');
        chaiExpect(result).to.not.be.empty; // eslint-disable-line no-unused-expressions

        return cpc.getRates(rateQuery);
      })
      .then(result => {
        chaiExpect(result).to.be.an('array');
        chaiExpect(result).to.not.be.empty; // eslint-disable-line no-unused-expressions
      });
  });

  it('Handles invalid postal codes', () => {
    const rateQuery = {
      parcelCharacteristics: {
        weight: 1
      },
      originPostalCode: 'Z9Z9Z9',
      destination: {
        domestic: {
          postalCode: 'POOT'
        }
      }
    };

    return cpc.getRates(rateQuery)
      .then(
        () => {
          chaiExpect.fail('Expected an invalid postal code to throw an error');
        },
        (err) => {
          chaiExpect(err).to.exist; // eslint-disable-line no-unused-expressions
          chaiExpect(err).to.be.an.instanceof(CanadaPostClient.CanadaPostError);
          chaiExpect(err.message).to.be.a.string; // eslint-disable-line no-unused-expressions
          chaiExpect(err.message).to.include('postal-code is not a valid instance of type')
          chaiExpect(err.message).to.include('Value is \'POOT\'');
          chaiExpect(err.message).to.include('PostalCodeType');
          chaiExpect(err.code).to.equal('Server');
          chaiExpect(err.originalMessages).to.be.an('array');
          chaiExpect(err.originalMessages.length).to.equal(1);
        }
      );
  });

  it('Can create a non-contract shipment', () => {
    const shipment = {
      requestedShippingPoint: 'V5C2H2',
      deliverySpec: {
        serviceCode: 'DOM.EP',
        sender: {
          company: 'Test Sender',
          contactPhone: '555-555-1234',
          addressDetails: {
            addressLine1: '4809 Albert St.',
            city: 'Burnaby',
            provState: 'BC',
            postalZipCode: 'V5C2H2'
          }
        },
        destination: {
          name: 'Test Recipient',
          addressDetails: {
            addressLine1: '9112 Emerald Dr.',
            city: 'Whistler',
            provState: 'BC',
            postalZipCode: 'V0N1B9',
            countryCode: 'CA'
          }
        },
        parcelCharacteristics: {
          weight: 1,
          document: false,
          dimensions: {
            length: 23,
            width: 18,
            height: 10
          }
        },
        preferences: {
          showPackingInstructions: true,
          showPostageRate: false,
          showInsuredValue: false
        },
        references: {
          customerRef1: 'test'
        }
      }
    };

    return cpc.createNonContractShipment(shipment)
      .then(result => {
        chaiExpect(result).to.be.an('object');
        chaiExpect(result).to.contain.keys('links', 'shipmentId', 'trackingPin');
        chaiExpect(result.links).to.contain.keys('label', 'self', 'details');
      });
  });

  it('Can get a tracking summary', () => {
    return cpc.getTrackingSummary('1681334332936901')
      .then(result => {
        chaiExpect(result).to.be.an('object');
        chaiExpect(result).to.contain.keys('actualDeliveryDate', 'attemptedDate', 'customerRef1', 'customerRef2',
          'deliveryOptionCompletedInd', 'destinationPostalId', 'destinationProvince', 'eventDateTime',
          'eventDescription', 'eventLocation', 'eventType', 'expectedDeliveryDate', 'mailedOnDate',
          'originPostalId', 'pin', 'returnPin', 'serviceName', 'signatoryName');
      });
  });

  it('Can get tracking detail', () => {
    return cpc.getTrackingDetail('1371134583769923')
      .then(result => {
        chaiExpect(result).to.be.an('object');
        chaiExpect(result).to.contain.keys('activeExists', 'archiveExists', 'changedExpectedDate',
          'changedExpectedDeliveryReason', 'customerRef1', 'customerRef2', 'deliveryOptions',
          'destinationPostalId', 'expectedDeliveryDate', 'mailedByCustomerNumber',
          'mailedOnBehalfOfCustomerNumber', 'originalPin', 'pin', 'returnPin', 'serviceName', 'serviceName2',
          'signatureImageExists', 'significantEvents', 'suppressSignature');

        chaiExpect(result.significantEvents).to.be.an('array');
        chaiExpect(result.significantEvents[0]).to.be.an('object');
        chaiExpect(result.significantEvents[0]).to.contain.keys('eventDate', 'eventDescription',
          'eventIdentifier', 'eventProvince', 'eventRetailLocationId', 'eventRetailName',
          'eventSite', 'eventTime', 'eventTimeZone', 'signatoryName');
      });
  });

  it('Can list shipments', () => {
    const timestamp = Date.now();
    return cpc.getShipments(timestamp - 115200000)
      .then(result => {
        chaiExpect(result).to.be.an('array');
        chaiExpect(result).to.not.be.empty; // eslint-disable-line no-unused-expressions
        chaiExpect(result[0]).to.contain.keys('shipmentId', 'href', 'mediaType', 'rel');
      });
  });

  it('Can get shipment links', () => {
    const timestamp = Date.now();
    return cpc.getShipments(timestamp - 115200000)
      .then(result => {
        chaiExpect(result).to.be.an('array');
        chaiExpect(result).to.not.be.empty; // eslint-disable-line no-unused-expressions

        return cpc.getShipment(result[0].shipmentId)
          .then((result) => {
            chaiExpect(result).to.be.an('object');
            chaiExpect(result).to.contain.keys('links', 'shipmentId', 'trackingPin');
            chaiExpect(result.links).to.contain.keys('label', 'self', 'details');
          });
      });
  });

  it('Can get shipment details', () => {
    const timestamp = Date.now();
    return cpc.getShipments(timestamp - 115200000)
      .then(result => {
        chaiExpect(result).to.be.an('array');
        chaiExpect(result).to.not.be.empty; // eslint-disable-line no-unused-expressions

        return cpc.getShipmentDetails(result[0].shipmentId)
          .then((result) => {
            chaiExpect(result).to.be.an('object');
            chaiExpect(result.nonContractShipmentDetails).to.contain.keys('deliverySpec', 'finalShippingPoint', 'trackingPin');
            chaiExpect(result.nonContractShipmentDetails.deliverySpec).to.contain.keys('destination', 'serviceCode', 'sender', 'parcelCharacteristics');
          });
      });
  });

  it('Can refund a shipment', () => {
    const timestamp = Date.now();
    return cpc.getShipments(timestamp - 115200000)
      .then(result => {
        chaiExpect(result).to.be.an('array');
        chaiExpect(result).to.not.be.empty; // eslint-disable-line no-unused-expressions

        return cpc.refundNonContractShipment(result[0].shipmentId, 'test@example.com')
          .then((result) => {
            chaiExpect(result).to.be.an('object');
            chaiExpect(result).to.contain.keys('serviceTicketId', 'serviceTicketDate');
          });
      });
  });

  it('Throws an error when there is a single request issue', () => {
    const failShipment = {
      requestedShippingPoint: 'M4X1P1',
      deliverySpec: {
        serviceCode: 'DOM.EP',
        sender: {
          company: 'Wes Bos',
          contactPhone: '911',
          addressDetails: {
            addressLine1: '123 Fake St.',
            city: 'Fake',
            provState: 'ON',
            postalZipCode: 'M4X1P1'
          }
        },
        destination: {
          name: 'Larry David',
          addressDetails: {
            addressLine1: '123 Fake St.',
            city: 'Fake',
            provState: 'ON',
            postalZipCode: 'M4X1P1'
          }
        },
        parcelCharacteristics: {
          weight: 1,
          document: false,
          dimensions: {
            length: 23,
            width: 18,
            height: 10
          }
        },
        preferences: {
          showPackingInstructions: true,
          showPostageRate: false,
          showInsuredValue: false
        }
      }
    };

    return cpc.createNonContractShipment(failShipment)
      .then(
        () => {
          chaiExpect.fail('Canada Post request succeeded with invalid shipment information.');
        },
        (err) => {
          chaiExpect(err).to.exist; // eslint-disable-line no-unused-expressions
          chaiExpect(err).to.be.an.instanceof(CanadaPostClient.CanadaPostError);
          chaiExpect(err.message).to.be.a.string; // eslint-disable-line no-unused-expressions
          chaiExpect(err.message).to.not.include('\n');
          chaiExpect(err.message).to.include('DestinationAddressDetailsType, required element');
          chaiExpect(err.message).to.include('country-code is missing');
          chaiExpect(err.code).to.equal('Server');
          chaiExpect(err.originalMessages).to.be.an('array');
          chaiExpect(err.originalMessages.length).to.equal(1);
        }
      );
  });

  it('Throws an error when there are multple request issues', () => {
    const failShipment = {
      requestedShippingPoint: 'M4X1P1',
      deliverySpec: {
        serviceCode: 'USA.XP',
        sender: {
          company: 'Wes Bos',
          contactPhone: '911',
          addressDetails: {
            addressLine1: '123 fake street',
            city: 'Fake',
            provState: 'ON',
            postalZipCode: 'M4X1P1'
          }
        },
        destination: {
          name: 'Larry David',
          addressDetails: {
            addressLine1: '123 Fake street',
            city: 'Denver',
            provState: 'CO',
            postalZipCode: '90210',
            countryCode: 'US'
          }
        },
        parcelCharacteristics: {
          weight: 1,
          document: false,
          dimensions: {
            length: 23,
            width: 18,
            height: 10
          }
        },
        preferences: {
          showPackingInstructions: true,
          showPostageRate: false,
          showInsuredValue: false
        }
      }
    };

    return cpc.createNonContractShipment(failShipment)
      .then(
        () => {
          chaiExpect.fail('Canada Post request succeeded with invalid shipment information.');
        },
        (err) => {
          chaiExpect(err).to.exist; // eslint-disable-line no-unused-expressions
          chaiExpect(err).to.be.an.instanceof(CanadaPostClient.CanadaPostError);
          chaiExpect(err.message).to.be.a.string; // eslint-disable-line no-unused-expressions
          chaiExpect(err.message).to.include('\n');
          chaiExpect(err.message).to.include('Contact Phone number is a required field.');
          chaiExpect(err.message).to.include('At least one line of Customs Description must be supplied.');
          chaiExpect(err.message).to.include('This product requires a valid value for Non-Delivery Handling.');
          chaiExpect(err.code).to.include(',');
          chaiExpect(err.code).to.include('2695');
          chaiExpect(err.code).to.include('1151');
          chaiExpect(err.code).to.include('8716');
          chaiExpect(err.originalMessages).to.be.an('array');
          chaiExpect(err.originalMessages.length).to.equal(3);
        }
      );
  });
});
