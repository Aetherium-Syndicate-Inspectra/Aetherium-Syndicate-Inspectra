const DEFAULT_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

export class FreezeLightClient {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    async save({ structure, fileFormat = 'png', fileName = 'frozen-light', imageDataBase64 = DEFAULT_IMAGE_BASE64 }) {
        return this.apiClient.request('/api/freeze/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                structure,
                file_name: fileName,
                file_format: fileFormat,
                image_data_base64: imageDataBase64,
                quality: {
                    confidence: 0.95,
                    freshness: 1,
                    completeness: 1
                }
            })
        });
    }

    async list() {
        return this.apiClient.get('/api/freeze/list');
    }

    async remove(id) {
        return this.apiClient.request(`/api/freeze/${id}`, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json'
            }
        });
    }
}
