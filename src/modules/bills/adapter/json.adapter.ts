import { InfilePayload } from 'src/services/infile/interfaces/payload';
import { BillPayload } from './payload.interface';
import builder from 'xmlbuilder';

export class JsonBillAdapter {
    private static template = {
        'dte:GTDocumento': {
            '@xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
            '@xmlns:dte': 'http://www.sat.gob.gt/dte/fel/0.2.0',
            '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            '@Version': '0.1',
            '@xsi:schemaLocation': 'http://www.sat.gob.gt/dte/fel/0.2.0',
            'dte:SAT': {
                '@ClaseDocumento': 'dte',
                'dte:DTE': {
                    '@ID': 'DatosCertificados',
                    'dte:DatosEmision': {
                        '@ID': 'DatosEmision',
                        'dte:DatosGenerales': {
                            '@CodigoMoneda': 'USD',
                            '@FechaHoraEmision': '',
                            '@Tipo': 'FACT',
                        },
                        'dte:Emisor': {
                            '@AfiliacionIVA': 'GEN',
                            '@CodigoEstablecimiento': '1',
                            '@NITEmisor': '',
                            '@NombreComercial': 'OSMO GT',
                            '@NombreEmisor': 'OSMO GUATEMALA, SOCIEDAD ANONIMA',
                            'dte:DireccionEmisor': {
                                'dte:Direccion': '16 CALLE 0-55 EDIFICIO INTERBANCO ZONA 10 15',
                                'dte:CodigoPostal': '0',
                                'dte:Municipio': 'GUATEMALA',
                                'dte:Departamento': 'GUATEMALA',
                                'dte:Pais': 'GT',
                            },
                        },
                        'dte:Receptor': {
                            '@IDReceptor': '',
                            '@NombreReceptor': '',
                            '@CorreoReceptor': '',
                            'dte:DireccionReceptor': {
                                'dte:Direccion': 'CUIDAD',
                                'dte:CodigoPostal': '0',
                                'dte:Municipio': 'GUATEMALA',
                                'dte:Departamento': 'GUATEMALA',
                                'dte:Pais': 'GT',
                            },
                        },
                        'dte:Frases': {
                            'dte:Frase': {
                                '@CodigoEscenario': '1',
                                '@TipoFrase': '1',
                            },
                        },
                        'dte:Items': {
                            'dte:Item': {
                                '@BienOServicio': 'S',
                                '@NumeroLinea': '1',
                                'dte:Cantidad': '1.00',
                                'dte:UnidadMedida': 'UNI',
                                'dte:Descripcion': 'Comisión por servicio Osmo Business',
                                'dte:PrecioUnitario': '19.52',
                                'dte:Precio': '19.52',
                                'dte:Descuento': '0.00',
                                'dte:Impuestos': {
                                    'dte:Impuesto': {
                                        'dte:NombreCorto': 'IVA',
                                        'dte:CodigoUnidadGravable': '1',
                                        'dte:MontoGravable': '17.4',
                                        'dte:MontoImpuesto': '2.09',
                                    },
                                },
                                'dte:Total': '19.52',
                            },
                        },
                        'dte:Totales': {
                            'dte:TotalImpuestos': {
                                'dte:TotalImpuesto': {
                                    '@NombreCorto': 'IVA',
                                    '@TotalMontoImpuesto': '10.71',
                                },
                            },
                            'dte:GranTotal': '100.00',
                        },
                    },
                },
            },
        },
    };

    static createBillTemplate(payload: BillPayload): InfilePayload {
        const currentDate = new Date();
        const emitionTime = this.getTime(currentDate);
        const billId =
            'FACT-' +
            currentDate.getMonth().toString().padStart(2, '0') +
            currentDate.getFullYear() +
            '-' +
            payload.userId +
            '-' +
            payload.currency;
        const item = this.getItem(payload);
        const xml = this.buildXml(item, payload, emitionTime);
        const xmlBuilded = builder.create(xml).end({ pretty: true });
        return {
            billId: billId,
            xml: xmlBuilded,
        };
    }

    private static buildXml(item: any, payload: BillPayload, date: string) {
        const templateCopy = JSON.parse(JSON.stringify(this.template));
        const gravable = (Number(payload.amount) / 1.12).toFixed(2);
        const iva = (Number(gravable) * 0.12).toFixed(2);
        templateCopy['dte:GTDocumento']['dte:SAT']['dte:DTE']['dte:DatosEmision']['dte:Emisor']['@NITEmisor'] =
            process.env.INFILE_NIT_EMISOR;
        templateCopy['dte:GTDocumento']['dte:SAT']['dte:DTE']['dte:DatosEmision']['dte:DatosGenerales']['@CodigoMoneda'] = payload.currency;
        templateCopy['dte:GTDocumento']['dte:SAT']['dte:DTE']['dte:DatosEmision']['dte:DatosGenerales']['@FechaHoraEmision'] = date;
        templateCopy['dte:GTDocumento']['dte:SAT']['dte:DTE']['dte:DatosEmision']['dte:Items']['dte:Item'] = item;
        templateCopy['dte:GTDocumento']['dte:SAT']['dte:DTE']['dte:DatosEmision']['dte:Receptor']['@IDReceptor'] = payload.nit;
        templateCopy['dte:GTDocumento']['dte:SAT']['dte:DTE']['dte:DatosEmision']['dte:Receptor']['@NombreReceptor'] = payload.fullName;
        templateCopy['dte:GTDocumento']['dte:SAT']['dte:DTE']['dte:DatosEmision']['dte:Receptor']['@CorreoReceptor'] = payload.email;
        templateCopy['dte:GTDocumento']['dte:SAT']['dte:DTE']['dte:DatosEmision']['dte:Totales']['dte:GranTotal'] = payload.amount;
        templateCopy['dte:GTDocumento']['dte:SAT']['dte:DTE']['dte:DatosEmision']['dte:Totales']['dte:TotalImpuestos']['dte:TotalImpuesto'][
            '@TotalMontoImpuesto'
        ] = iva;
        return templateCopy;
    }

    private static getItem(payload: BillPayload) {
        const gravable = (Number(payload.amount) / 1.12).toFixed(2);
        const iva = (Number(gravable) * 0.12).toFixed(2);
        return {
            '@BienOServicio': 'S',
            '@NumeroLinea': '1',
            'dte:Cantidad': '1.00',
            'dte:UnidadMedida': 'UNI',
            'dte:Descripcion': 'Comisión por asesoramiento en compra y venta de activos digitales',
            'dte:PrecioUnitario': payload.amount,
            'dte:Precio': payload.amount,
            'dte:Descuento': '0.00',
            'dte:Impuestos': {
                'dte:Impuesto': {
                    'dte:NombreCorto': 'IVA',
                    'dte:CodigoUnidadGravable': '1',
                    'dte:MontoGravable': gravable,
                    'dte:MontoImpuesto': iva,
                },
            },
            'dte:Total': payload.amount,
        };
    }

    private static getTime(currentDate: Date) {
        const year = currentDate.getFullYear();
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const day = currentDate.getDate().toString().padStart(2, '0');
        const hours = currentDate.getHours().toString().padStart(2, '0');
        const minutes = currentDate.getMinutes().toString().padStart(2, '0');
        const seconds = currentDate.getSeconds().toString().padStart(2, '0');
        const milli = currentDate.getMilliseconds().toString().padStart(3, '0');

        const time = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + '.' + milli + '-06:00';
        return time;
    }
}
