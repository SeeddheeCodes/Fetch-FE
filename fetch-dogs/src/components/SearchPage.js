import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  Autocomplete,
  TextField,
  FormControl,
  Select,
  MenuItem,
  AppBar,
  Toolbar,
  IconButton,
  Pagination,
  CircularProgress,
  Snackbar,
  Alert,
  Drawer,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  LogoutOutlined,
  Sort,
  FilterList,
  LocationOn,
  Search
} from '@mui/icons-material';


import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';



const MatchDialog = ({ open, onClose, favorites, onGenerateMatch }) => (
  <Dialog 
    open={open} 
    onClose={onClose}
    maxWidth="md"
    fullWidth
  >
    <DialogTitle>
      Your Liked Dogs ({favorites.length})
    </DialogTitle>
    <DialogContent>
      <Grid container spacing={2}>
        {favorites.map((dog) => (
          <Grid item xs={12} sm={6} md={4} key={dog.id}>
            <Card>
              <CardMedia
                component="img"
                height="140"
                image={dog.img}
                alt={dog.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Typography variant="h6" component="div">
                  {dog.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {dog.breed} • {dog.age} years
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="inherit">
        Cancel
      </Button>
      <Button 
        onClick={onGenerateMatch} 
        color="primary" 
        variant="contained"
        disabled={favorites.length === 0}
      >
        Generate Match
      </Button>
    </DialogActions>
  </Dialog>
);


const SearchPage = () => {
  const { logout } = useAuth();
  const [dogs, setDogs] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [selectedBreeds, setSelectedBreeds] = useState([]);
  const [sortOrder, setSortOrder] = useState('breed:asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [showMatchAlert, setShowMatchAlert] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [locationSearchText, setLocationSearchText] = useState('');
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationCache, setLocationCache] = useState({}); // Cache for zip code to location mapping
  const [maxDistance, setMaxDistance] = useState(50);
  const [currentTab, setCurrentTab] = useState('search'); 
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };


  // Fetch breeds on mount
  useEffect(() => {
    fetchBreeds();
  }, []);

  // Fetch dogs when filters/sort/page changes
  useEffect(() => {
    fetchDogs();
  }, [selectedBreeds, sortOrder, page, selectedLocation, maxDistance]);

  const fetchBreeds = async () => {
    try {
      const response = await fetch('https://frontend-take-home-service.fetch.com/dogs/breeds', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setBreeds(data);
      }
    } catch (err) {
      setError('Failed to fetch breeds');
    }
  };

  // Location search with debounce
  useEffect(() => {
    const searchLocations = async () => {
      if (!locationSearchText || locationSearchText.length < 2) {
        setLocations([]);
        setLocationLoading(false);
        return;
      }
      
      setLocationLoading(true);
      
      try {
        const response = await fetch('https://frontend-take-home-service.fetch.com/locations/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            city: locationSearchText,
            size: 10
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Location search failed: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (!data.results) {
          throw new Error('Invalid response format');
        }
        
        // Filter out any duplicate locations by zip code
        const uniqueLocations = data.results.filter((location, index, self) =>
          index === self.findIndex((t) => t.zip_code === location.zip_code)
        );
        
        setLocations(uniqueLocations);
      } catch (err) {
        console.error('Location search error:', err);
        setError('Failed to search locations: ' + err.message);
        setLocations([]);
      } finally {
        setLocationLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchLocations, 500);
    return () => clearTimeout(debounceTimeout);
  }, [locationSearchText]);




  

  // Fetch location details for zip codes
  const fetchLocationDetails = async (zipCodes) => {
    const uniqueZips = [...new Set(zipCodes)].filter(zip => !locationCache[zip]);
    
    if (uniqueZips.length === 0) return;

    try {
      const response = await fetch('https://frontend-take-home-service.fetch.com/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(uniqueZips)
      });

      if (!response.ok) throw new Error('Failed to fetch location details');
      
      const locations = await response.json();
      const newCache = { ...locationCache };
      
      locations.forEach(location => {
        newCache[location.zip_code] = location;
      });
      
      setLocationCache(newCache);
    } catch (err) {
      console.error('Failed to fetch location details:', err);
    }
  };



  const toggleFavorite = (dog) => {
    setFavorites(prev => {
      const isCurrentlyFavorited = prev.some(fav => fav.id === dog.id);
      if (isCurrentlyFavorited) {
        return prev.filter(fav => fav.id !== dog.id); // Fixed the logic here
      }
      return [...prev, dog];
    });
  };

  const generateMatch = async () => {
    if (favorites.length === 0) {
      setError('Please select some favorite dogs first');
      return;
    }

    try {
      const response = await fetch('https://frontend-take-home-service.fetch.com/dogs/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(favorites.map(dog => dog.id))
      });

      if (!response.ok) throw new Error('Failed to generate match');
      
      const { match } = await response.json();
      const matchedDog = favorites.find(dog => dog.id === match);
      setMatchResult(matchedDog);
      setShowMatchAlert(true);
    } catch (err) {
      setError('Failed to generate match');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('https://frontend-take-home-service.fetch.com/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      await logout();
    } catch (err) {
      setError('Failed to logout');
    }
  };

  const fetchDogs = async () => {
    setIsLoading(true);
    try {
      let zipCodes = [];
      if (selectedLocation) {
        zipCodes = await getNearbyZipCodes(selectedLocation.zip_code, maxDistance);
        if (zipCodes.length === 0) {
          setDogs([]);
          setTotalPages(0);
          setError('No locations found within the selected radius');
          return;
        }
      }

      const searchParams = new URLSearchParams({
        size: 20,
        sort: sortOrder,
      });
      
      if (selectedBreeds.length > 0) {
        selectedBreeds.forEach(breed => searchParams.append('breeds', breed));
      }

      if (zipCodes.length > 0) {
        zipCodes.forEach(zip => searchParams.append('zipCodes', zip));
      }

      const searchResponse = await fetch(
        `https://frontend-take-home-service.fetch.com/dogs/search?${searchParams}`,
        { credentials: 'include' }
      );

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        throw new Error(`Search failed: ${errorText}`);
      }
      
      const { resultIds, total } = await searchResponse.json();
      setTotalPages(Math.ceil(total / 20));

      if (resultIds.length === 0) {
        setDogs([]);
        return;
      }

      const dogsResponse = await fetch('https://frontend-take-home-service.fetch.com/dogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(resultIds)
      });

      if (!dogsResponse.ok) {
        const errorText = await dogsResponse.text();
        throw new Error(`Failed to fetch dog details: ${errorText}`);
      }
      
      const dogData = await dogsResponse.json();
      
      // Fetch location details for all dogs
      await fetchLocationDetails(dogData.map(dog => dog.zip_code));
      
      setDogs(dogData);
    } catch (err) {
      console.error('Error fetching dogs:', err);
      setError(err.message);
      setDogs([]);
    } finally {
      setIsLoading(false);
    }
  };


  // Helper function to get nearby zip codes
  const getNearbyZipCodes = async (zipCode, radius) => {
    try {
      const response = await fetch('https://frontend-take-home-service.fetch.com/locations/near-by', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          zip_code: zipCode,
          mile_radius: Number(radius)  // Ensure radius is a number
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch nearby locations: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data.zip_codes)) {
        throw new Error('Invalid response format for nearby zip codes');
      }
      
      return data.zip_codes;
    } catch (err) {
      console.error('Failed to fetch nearby zip codes:', err);
      setError(`Failed to fetch nearby locations: ${err.message}`);
      return [zipCode]; // Fallback to just the selected zip code
    }
  };

  const formatLocation = (zipCode) => {
    const location = locationCache[zipCode];
    if (!location) return zipCode;
    return `${location.city}, ${location.state}`;
  };

  // Rest of the component remains the same, but update the Card rendering:
  const renderDogCard = (dog) => (
    <Grid item xs={12} sm={6} md={4} lg={3} key={dog.id}>
      <Card>
        <CardMedia
          component="img"
          height="200"
          image={dog.img}
          alt={dog.name}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent>
          <Typography gutterBottom variant="h6" component="div">
            {dog.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Breed: {dog.breed}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Age: {dog.age} years
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Location: {formatLocation(dog.zip_code)}
          </Typography>
        </CardContent>
        <CardActions>
          <IconButton 
            onClick={() => toggleFavorite(dog)}
            color={favorites.some(fav => fav.id === dog.id) ? 'primary' : 'default'}
          >
            {favorites.some(fav => fav.id === dog.id) ? (
              <Favorite />
            ) : (
              <FavoriteBorder />
            )}
          </IconButton>
        </CardActions>
      </Card>
    </Grid>
  );



  const handleMatchClick = () => {
    if (favorites.length === 0) {
      setError('Please select some favorite dogs first');
      return;
    }
    setMatchDialogOpen(true);
  };

  const handleGenerateMatch = async () => {
    try {
      const response = await fetch('https://frontend-take-home-service.fetch.com/dogs/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(favorites.map(dog => dog.id))
      });

      if (!response.ok) throw new Error('Failed to generate match');
      
      const { match } = await response.json();
      const matchedDog = favorites.find(dog => dog.id === match);
      setMatchResult(matchedDog);
      setShowMatchAlert(true);
      setMatchDialogOpen(false);
    } catch (err) {
      setError('Failed to generate match');
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="primary" sx={{ mb: 4 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Dog Finder
          </Typography>
          <Button 
            color="inherit"
            onClick={() => setDrawerOpen(true)}
            startIcon={<FilterList />}
          >
            Location
          </Button>
          <Button 
            color="inherit" 
            onClick={generateMatch}
            startIcon={<Favorite />}
            disabled={favorites.length === 0}
          >
            Find Match ({favorites.length})
          </Button>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutOutlined />
          </IconButton>
        </Toolbar>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          centered
          sx={{ bgcolor: 'primary.main' }}
        >
          <Tab 
            label="Search" 
            value="search" 
            icon={<Search />} 
            iconPosition="start"
          />
          <Tab 
            label={`Favorites (${favorites.length})`} 
            value="favorites" 
            icon={<Favorite />} 
            iconPosition="start"
          />
        </Tabs>
      </AppBar>
  
      <Container maxWidth="lg">
        {currentTab === 'search' ? (
          <>
            <Box sx={{ mb: 4 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Autocomplete
                    multiple
                    options={breeds}
                    value={selectedBreeds}
                    onChange={(event, newValue) => {
                      setSelectedBreeds(newValue);
                      setPage(1);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Filter by Breed"
                        placeholder="Select breeds..."
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <Select
                      value={sortOrder}
                      onChange={(event) => {
                        setSortOrder(event.target.value);
                        setPage(1);
                      }}
                      startAdornment={<Sort />}
                    >
                      <MenuItem value="breed:asc">Breed (A-Z)</MenuItem>
                      <MenuItem value="breed:desc">Breed (Z-A)</MenuItem>
                      <MenuItem value="name:asc">Name (A-Z)</MenuItem>
                      <MenuItem value="name:desc">Name (Z-A)</MenuItem>
                      <MenuItem value="age:asc">Age (Youngest)</MenuItem>
                      <MenuItem value="age:desc">Age (Oldest)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
  
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {dogs.map(renderDogCard)}
              </Grid>
            )}
  
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={(event, value) => setPage(value)} 
                color="primary"
              />
            </Box>
          </>
        ) : (
          <Box>
            <Typography variant="h5" sx={{ mb: 3 }}>
              Your Favorite Dogs
            </Typography>
            {favorites.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: '200px',
                bgcolor: 'grey.100',
                borderRadius: 1
              }}>
                <Typography color="text.secondary">
                  No favorite dogs yet. Like some dogs to see them here!
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {favorites.map(renderDogCard)}
              </Grid>
            )}
          </Box>
        )}
      </Container>
  
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Location Filters
          </Typography>
          
          <Autocomplete
            options={locations}
            loading={locationLoading}
            getOptionLabel={(option) => 
              option ? `${option.city}, ${option.state} ${option.zip_code}` : ''
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search by city"
                placeholder="Type to search..."
                onChange={(e) => {
                  setLocationSearchText(e.target.value);
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {locationLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            onChange={(event, newValue) => {
              setSelectedLocation(newValue);
              setPage(1);
              if (newValue) {
                setDrawerOpen(false);
              }
            }}
            onInputChange={(event, newInputValue, reason) => {
              if (reason === 'input') {
                setLocationSearchText(newInputValue);
              }
            }}
            value={selectedLocation}
            isOptionEqualToValue={(option, value) => 
              option?.zip_code === value?.zip_code
            }
            filterOptions={(x) => x}
            noOptionsText={locationSearchText.length < 2 ? "Type to search..." : "No locations found"}
          />
    
          <Box sx={{ mt: 3 }}>
            <Typography gutterBottom>Max Distance</Typography>
            <Select
              fullWidth
              value={maxDistance}
              onChange={(e) => {
                setMaxDistance(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value={10}>10 miles</MenuItem>
              <MenuItem value={25}>25 miles</MenuItem>
              <MenuItem value={50}>50 miles</MenuItem>
              <MenuItem value={100}>100 miles</MenuItem>
            </Select>
          </Box>
    
          {selectedLocation && (
            <Box sx={{ mt: 3 }}>
              <Typography gutterBottom>Active Filters:</Typography>
              <Chip
                label={`${selectedLocation.city}, ${selectedLocation.state}`}
                onDelete={() => {
                  setSelectedLocation(null);
                  setPage(1);
                }}
                icon={<LocationOn />}
              />
            </Box>
          )}
        </Box>
      </Drawer>
  
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
  
      <Snackbar
        open={showMatchAlert}
        autoHideDuration={6000}
        onClose={() => setShowMatchAlert(false)}
      >
        <Alert 
          severity="success" 
          onClose={() => setShowMatchAlert(false)}
        >
          {matchResult && (
            <>
              You've been matched with {matchResult.name}! 
              A {matchResult.breed}, {matchResult.age} years old from {formatLocation(matchResult.zip_code)}.
            </>
          )}
        </Alert>
      </Snackbar>


      <MatchDialog 
        open={matchDialogOpen}
        onClose={() => setMatchDialogOpen(false)}
        favorites={favorites}
        onGenerateMatch={handleGenerateMatch}
      />

    </Box>
  );}


  export default SearchPage;
