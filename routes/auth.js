app.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, phone, dob, country, favoriteDestination, travelStyle, interests } = req.body;

  try {
    const newUser = new User({
      firstName,
      lastName,
      email,
      password, // Note: Ensure to hash passwords in production
      phone,
      dob,
      country,
      favoriteDestination,
      travelStyle,
      interests
    });

    await newUser.save();
    res.status(201).send('User registered successfully');
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).send('Error registering user');
  }
});
