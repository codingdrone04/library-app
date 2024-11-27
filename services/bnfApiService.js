import axios from 'axios';
import xml2js from 'xml2js';

const BASE_URL = 'http://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve';

export const searchBookByTitle = async (title) => {
    try {
        const query = `(bib.title all "${title}")`;
        const response = await axios.get(`${BASE_URL}&query=${encodeURIComponent(query)}`);

        const parser = new xml2js.Parser();
        const result = await new Promise((resolve, reject) => {
            parser.parseString(response.data, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        const records = result['srw:searchRetrieveResponse']['srw:records'][0]['srw:record'];

        if (Array.isArray(records)) {
            return records.map(record => {
                const recordData = record['srw:recordData'][0]['mxc:record'][0];

                const titleField = recordData['mxc:datafield'].find(field => field['$']['tag'] === '200');
                const title = titleField ? titleField['mxc:subfield'].find(subfield => subfield['$']['code'] === 'a')._ : 'Titre non trouvé';

                const authorField = recordData['mxc:datafield'].find(field => field['$']['tag'] === '700');
                const author = authorField ? authorField['mxc:subfield'].find(subfield => subfield['$']['code'] === 'a')._ : 'Auteur non trouvé';

                const genreField = recordData['mxc:datafield'].find(field => field['$']['tag'] === '650');
                const genre = genreField ? genreField['mxc:subfield'].find(subfield => subfield['$']['code'] === 'a')._ : 'Genre non trouvé';

                const coverField = recordData['mxc:datafield'].find(field => field['$']['tag'] === '210');
                const cover = coverField ? coverField['mxc:subfield'].find(subfield => subfield['$']['code'] === 'a')._ : null; // Remplace par la logique pour obtenir la couverture si elle existe

                return {
                    id: recordData['$']['id'],
                    title,
                    author,
                    genre,
                    cover, // Assurez-vous que cette valeur est une URL valide
                };
            });
        } else {
            console.error('Aucun enregistrement trouvé.');
            return [];
        }
    } catch (error) {
        console.error('Erreur lors de la recherche de livres:', error);
        throw error;
    }
};
