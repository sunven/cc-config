use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AppSettings {
    pub window_width: u32,
    pub window_height: u32,
    pub theme: String,
    pub auto_save: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            window_width: 800,
            window_height: 600,
            theme: "light".to_string(),
            auto_save: true,
        }
    }
}

pub fn load_settings() -> Result<AppSettings, Box<dyn std::error::Error>> {
    // TODO: Load settings from file
    // This will be implemented in future stories
    Ok(AppSettings::default())
}

pub fn save_settings(settings: &AppSettings) -> Result<(), Box<dyn std::error::Error>> {
    // TODO: Save settings to file
    // This will be implemented in future stories
    println!("Saving settings: {:?}", settings);
    Ok(())
}
