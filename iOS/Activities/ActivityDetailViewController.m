//
//  ActivityDetailViewController.m
//  Activities
//
//  Created by Owen Campbell-Moore on 01/08/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import "ActivityDetailViewController.h"
#import "AppDelegate.h"
#import "GlobalStyles.h"

@interface ActivityDetailViewController ()

@end

@implementation ActivityDetailViewController

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        self.title = @"Activity Detail";
        self.view.backgroundColor = [[GlobalStyles sharedGlobal] backgroundGreyColor];
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (IBAction)removeActivityPressed:(id)sender {
    // Get access to the activities model to request removal
    AppDelegate *appDelegate = (AppDelegate*)[[UIApplication sharedApplication] delegate];
    [appDelegate.activities removeActivity:activity];
    
    // Pop this controller
    [self.navigationController popViewControllerAnimated:YES];
}

- (void)setActivity:(Activity*)theActivity {
    activity = theActivity;
    self.descriptionLabel.text = activity.description;
    self.locationLabel.text = [@"Location: " stringByAppendingString:activity.location];
}

@end
