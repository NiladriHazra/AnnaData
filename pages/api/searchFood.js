export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  
    try {
      // Get search term from query params or request body
      const searchTerm = req.method === 'GET' ? req.query.term : req.body.searchTerm;
      
      if (!searchTerm) {
        return res.status(400).json({ message: 'Search term is required' });
      }
  
      // Use hardcoded credentials for now to ensure they're correct
      const url = `https://gateway.apyflux.com/search?value=${encodeURIComponent(searchTerm)}`;
      const headers = {
        'x-app-id': '1948be40-3210-4d66-bb38-b660249ef2dc',
        'x-client-id': 'cqaLkuhz2fC9CSHvy6DDSMwnfo1',
        'x-api-key': 'VDgo59ASmjhUsIkrSVLqlWgxMsC7EctF/ErrAk6nAzW4='
      };
  
      console.log("Searching for food:", searchTerm);
      console.log("Using URL:", url);
      console.log("Using headers:", JSON.stringify(headers));
  
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', response.status, errorText);
        return res.status(response.status).json({
          message: 'Error from food API',
          status: response.status,
          error: errorText
        });
      }
  
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Error searching food:', error);
      res.status(500).json({ message: 'Error searching food', error: error.message });
    }
  }