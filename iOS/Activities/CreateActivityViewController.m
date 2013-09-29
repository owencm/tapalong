//
//  CreateActivityViewController.m
//  Activities
//
//  Created by Owen Campbell-Moore on 29/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <RestKit/RestKit.h>
#import "CreateActivityViewController.h"
#import "GlobalColors.h"
#import "GlobalNetwork.h"
#import "Activity.h"

@interface CreateActivityViewController ()

@end

@implementation CreateActivityViewController

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        [[self view] setBackgroundColor:[[GlobalColors sharedGlobal] backgroundGreyColor]];
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    self.datePicker.minimumDate = [NSDate date];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (IBAction)createActivityPressed:(id)sender {
    Activity *activity = [[Activity alloc] init];
    activity.title = @"Playing Board Games in the Library";
    activity.description = @"description";
    activity.location = @"location";
    activity.max_attendees = @"-1";
    activity.start_time = [[self datePicker] date];
    
    [[GlobalNetwork sharedGlobal] createActivity:activity];
}
@end
